import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore, storage
from datetime import datetime
import base64
import io
import uuid
from werkzeug.utils import secure_filename

# Load .env automatically for local development (so `flask run` also works).
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

SUPPORTED_LANGS = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "ta": "Tamil",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "bho": "Bhojpuri",
}

def normalize_lang(lang: str) -> str:
    lang = (lang or "en").strip().lower()
    return lang if lang in SUPPORTED_LANGS else "en"

# --- Flask App Setup ---
app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

# --- Configuration ---
IMG_HEIGHT = 128
IMG_WIDTH = 128

# Model and class indices file paths
MODEL_FILENAME = 'crop_diagnosis_best_model.tflite'
CLASS_INDICES_FILENAME = os.path.join(os.getcwd(), 'class_indices.json')

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Global variables for model and class labels ---
model = None 
class_labels = None
db = None 

# --- Initialize Firebase Admin SDK (Optimized for Render Environment Variables) ---
def initialize_firebase():
    global db
    print("Attempting to initialize Firebase...")
    try:
        firebase_config_json = os.getenv("FIREBASE_CONFIG_JSON")
        firebase_config_obj = None

        if firebase_config_json:
            firebase_config_obj = json.loads(firebase_config_json)
            print("Using FIREBASE_CONFIG_JSON environment variable for Firebase initialization.")
        else:
            # Local fallback: try service account JSON file (DO NOT use this on production).
            for candidate in ("serviceAccountKey.json", "plant-disease-detection-467016-55dc39c76029.json"):
                if os.path.exists(candidate):
                    with open(candidate, "r", encoding="utf-8") as f:
                        firebase_config_obj = json.load(f)
                    print(f"Using local Firebase service account file for initialization: {candidate}")
                    break

        if not firebase_config_obj:
            print("CRITICAL ERROR: Firebase service account not configured.")
            print("Set FIREBASE_CONFIG_JSON env var (recommended), or provide serviceAccountKey.json for local dev.")
            return False

        cred = credentials.Certificate(firebase_config_obj)

        if not firebase_admin._apps:
            storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")
            if not storage_bucket:
                project_id = firebase_config_obj.get("project_id")
                if project_id:
                    storage_bucket = f"{project_id}.appspot.com"

            options = {"storageBucket": storage_bucket} if storage_bucket else None
            firebase_admin.initialize_app(cred, options=options or {})
        db = firestore.client()
        print(f"Firebase initialized successfully. db object is: {db}")
        return True
    except Exception as e:
        print(f"Failed to initialize Firebase: {e}")
        import traceback
        traceback.print_exc()
        return False


def ensure_firebase_initialized():
    """
    Make Firebase init resilient in local dev and when app.py is imported (e.g. gunicorn/flask run).
    """
    global db
    if db is not None:
        return True
    return initialize_firebase()

# --- Load Model and Class Indices on startup ---
def load_resources():
    global model, class_labels
    print("Attempting to load model and class indices...")
    try:
        if not os.path.exists(MODEL_FILENAME):
            print(f"Error: Model file not found at {MODEL_FILENAME}. Please ensure it's committed to GitHub.")
            return False
        if not os.path.exists(CLASS_INDICES_FILENAME):
            print(f"Error: Class indices file not found at {CLASS_INDICES_FILENAME}. Please ensure it's in the project root.")
            return False

        # --- Load TFLite model using Interpreter ---
        interpreter = tf.lite.Interpreter(model_path=MODEL_FILENAME)
        interpreter.allocate_tensors()
        model = interpreter 

        with open(CLASS_INDICES_FILENAME, 'r') as f:
            class_indices = json.load(f)
        class_labels = {v: k for k, v in class_indices.items()}
        print("Model and class indices loaded successfully.")
        return True
    except Exception as e:
        print(f"Failed to load model or class indices: {e}")
        import traceback
        traceback.print_exc()
        return False


# --- Gemini Integration ---
def get_gemini_diagnosis(disease_name, user_context):
    if not GEMINI_API_KEY:
        return "Error: Gemini API key not configured on the backend. Please set the GEMINI_API_KEY environment variable."

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-2.5-flash')

        lang = normalize_lang(user_context.get("lang"))
        lang_name = SUPPORTED_LANGS[lang]

        prompt = f"""
        Act as an expert agronomist and plant pathologist for a user in India.
        IMPORTANT: Write the entire response in {lang_name}.
        Use clear markdown headings and bullet points. Bold key actions and key warnings.

        *Primary Diagnosis from Image Analysis:*
        The image analysis model has identified the plant disease as: "{disease_name.replace('_', ' ')}".

        *Additional Context from the User (Detailed Questionnaire):*
        - Plant Symptoms:
            - Leaf discoloration observed: "{user_context.get('leaf_discoloration', 'Not specified.')}"
            - Wilting or dropping: "{user_context.get('wilting_dropping', 'Not specified.')}"
        - Environmental Conditions:
            - Recent weather: "{user_context.get('recent_weather', 'Not specified.')}"
            - Temperature condition: "{user_context.get('temperature_condition', 'Not specified.')}"
        - Treatment History:
            - Recent fertilizer application: "{user_context.get('recent_fertilizer', 'Not specified.')}"
            - Previous pesticide use: "{user_context.get('previous_pesticide', 'Not specified.')}"
        - Pest Observations:
            - Insects observed: "{user_context.get('insects_observed', 'Not specified.')}"
            - Evidence of pest damage: "{user_context.get('evidence_of_damage', 'Not specified.')}"
        - Plant Management:
            - Watering frequency: "{user_context.get('watering_frequency', 'Not specified.')}"
            - Plant age/growth stage: "{user_context.get('plant_age_growth', 'Not specified.')}"

        *Your Task:*
        Based on all the information above, provide a comprehensive and actionable report. Structure your response with the following sections using clear markdown:

        1. *Integrated Diagnosis*
        2. *Immediate Action Plan (Organic)*
        3. *Immediate Action Plan (Chemical)*
        4. *Long-Term Prevention Strategy*
        5. *Local Agricultural Support (India)*
        """

        response = gemini_model.generate_content(prompt)
        return response.text

    except Exception as e:
        return f"An error occurred with the Gemini API: {e}"

# --- Prediction Endpoint ---
@app.route('/predict', methods=['POST'])
def predict():
    if not model or not class_labels:
        return jsonify({"error": "Model not loaded. Please ensure model and class indices files exist."}), 500

    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        img_bytes = file.read()
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        img_stream = io.BytesIO(img_bytes)
        
        img = image.load_img(img_stream, target_size=(IMG_HEIGHT, IMG_WIDTH))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0).astype(np.float32) / 255.0

        # --- TFLite Inference ---
        input_details = model.get_input_details()
        output_details = model.get_output_details()

        # Set input tensor
        model.set_tensor(input_details[0]['index'], img_array)
        
        # Run inference
        model.invoke()
        
        # Get output tensor
        prediction = model.get_tensor(output_details[0]['index'])
        # --- End TFLite Inference ---

        predicted_class_index = np.argmax(prediction[0])
        confidence = np.max(prediction[0]) * 100
        predicted_class_name = class_labels[predicted_class_index]

        if db:
            history_ref = db.collection('predictions')
            history_ref.add({
                'timestamp': firestore.SERVER_TIMESTAMP,
                'image_base64': img_base64,
                'predicted_class_name': predicted_class_name,
                'confidence': float(confidence)
            })

        return jsonify({
            "predicted_class_name": predicted_class_name,
            "confidence": float(confidence)
        })
    except Exception as e:
        print(f"ERROR during prediction: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error during prediction: {e}"}), 500

# --- Get Diagnosis Endpoint ---
@app.route('/get_diagnosis', methods=['POST'])
def get_diagnosis():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request data"}), 400

    disease_name = data.get('disease_name')
    user_context = data.get('user_context', {}) or {}
    user_context["lang"] = normalize_lang(data.get("lang") or user_context.get("lang"))

    if not disease_name:
        return jsonify({"error": "Disease name is required for diagnosis"}), 400

    final_report = get_gemini_diagnosis(disease_name, user_context)
    return jsonify({"report": final_report})

# --- Translation endpoint (UI multi-language support) ---
@app.route('/translate', methods=['POST'])
def translate():
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key not configured on the backend (GEMINI_API_KEY)."}), 500

    data = request.get_json() or {}
    lang = normalize_lang(data.get("lang"))
    texts = data.get("texts") or []

    if not isinstance(texts, list) or not all(isinstance(t, str) for t in texts):
        return jsonify({"error": "texts must be a list of strings"}), 400

    # Basic safety limits
    if len(texts) > 200:
        return jsonify({"error": "Too many strings to translate in one request"}), 400

    # Short-circuit English
    if lang == "en":
        return jsonify({"translations": texts})

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        lang_name = SUPPORTED_LANGS[lang]

        # Ask for strict JSON array output to keep ordering.
        prompt = f"""
Translate the following UI strings into {lang_name}.
Rules:
- Return ONLY a valid JSON array of strings (no markdown, no explanation).
- Keep ordering exactly the same.
- Keep numbers, URLs, and units unchanged.
- Keep product/app name "AI Crop Doctor" as-is.

Strings to translate (JSON array):
{json.dumps(texts, ensure_ascii=False)}
"""

        response = gemini_model.generate_content(prompt)
        raw = (response.text or "").strip()

        # Try to parse JSON array; if model wrapped in code fences, strip them.
        if raw.startswith("```"):
            raw = raw.strip("`")
            raw = raw.replace("json", "", 1).strip()

        translated = json.loads(raw)
        if not isinstance(translated, list):
            raise ValueError("Translation response is not a JSON array")

        # Ensure length match
        if len(translated) != len(texts):
            # Fallback: pad/trim to match
            translated = (translated + texts)[: len(texts)]

        return jsonify({"translations": translated})
    except Exception as e:
        print(f"ERROR during translation: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Translation error: {e}"}), 500

# --- History Endpoint ---
@app.route('/history', methods=['GET'])
def get_history():
    if not ensure_firebase_initialized():
        print("ERROR: Firestore 'db' object is None before history fetch.")
        return jsonify({"error": "Firestore not initialized."}), 500

    try:
        predictions_ref = db.collection('predictions').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(50)
        docs = predictions_ref.stream()

        history_data = []
        for doc in docs:
            data = doc.to_dict()
            if 'timestamp' in data and data['timestamp']:
                data['timestamp'] = data['timestamp'].isoformat()
            history_data.append(data)

        return jsonify({"history": history_data})
    except Exception as e:
        print(f"ERROR fetching history: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error fetching history: {e}"}), 500

# --- Emergency Support Endpoint ---
@app.route('/emergency', methods=['POST'])
def emergency_support():
    """
    Stores emergency support requests in Firestore (same Firebase project) and optionally uploads an image
    to Firebase Storage (same project/bucket).
    """
    if not ensure_firebase_initialized():
        return jsonify({"error": "Firestore not initialized."}), 500

    name = (request.form.get('name') or '').strip()
    phone = (request.form.get('phone') or '').strip()
    issue = (request.form.get('issue') or '').strip()

    if not name or not phone or not issue:
        return jsonify({"error": "Name, phone, and issue are required."}), 400

    image_file = request.files.get('image')
    image_info = None

    # Optional image upload to Firebase Storage
    if image_file and image_file.filename:
        try:
            bucket = storage.bucket()
            if not bucket or not bucket.name:
                return jsonify({"error": "Firebase Storage bucket not configured. Set FIREBASE_STORAGE_BUCKET."}), 500

            safe_name = secure_filename(image_file.filename)
            blob_path = f"emergency_issues/{uuid.uuid4().hex}_{safe_name}"
            blob = bucket.blob(blob_path)
            blob.upload_from_file(image_file.stream, content_type=image_file.mimetype)

            image_info = {
                "bucket": bucket.name,
                "path": blob_path,
                "content_type": image_file.mimetype,
                "gs_uri": f"gs://{bucket.name}/{blob_path}",
            }
        except Exception as e:
            print(f"ERROR uploading emergency image: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Failed to upload image: {e}"}), 500

    try:
        doc_ref = db.collection('emergency_issues').document()
        doc_ref.set({
            "created_at": firestore.SERVER_TIMESTAMP,
            "status": "new",
            "name": name,
            "phone": phone,
            "issue": issue,
            "image": image_info,
            "user_agent": request.headers.get("User-Agent"),
            "ip": request.headers.get("X-Forwarded-For", request.remote_addr),
        })
        return jsonify({"ok": True, "id": doc_ref.id})
    except Exception as e:
        print(f"ERROR saving emergency issue: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to save request: {e}"}), 500

# --- Frontend Routes ---
@app.route('/')
def home():
    firebase_context = {
        "apiKey": os.getenv("FIREBASE_API_KEY"),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
        "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
        "appId": os.getenv("FIREBASE_APP_ID"),
        "measurementId": os.getenv("FIREBASE_MEASUREMENT_ID")
    }
    return render_template('index.html', firebase_context=firebase_context)

@app.route('/history_page')
def history_page():
    return render_template('history.html')

@app.route('/user_guide')
def user_guide():
    return render_template('user_guide.html') # Assuming user_guide.html is the correct filename

@app.route('/tools')
def tools_page():
    return render_template('tools.html')

# -------------------------------
# Legal / Informational Pages
# -------------------------------

@app.route("/privacy")
def privacy_policy():
    return render_template("privacy.html")


@app.route("/terms")
def terms_of_use():
    return render_template("terms.html")


@app.route("/disclaimer")
def disclaimer():
    return render_template("disclaimer.html")


if __name__ == '__main__':
    # This block is for local development only, It will NOT run when Gunicorn imports app.py on Render.
    print("Starting Flask server for local development...")
    
    # Load environment variables from .env file
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("Loaded environment variables from .env")
    except ImportError:
        print("python-dotenv not found, skipping .env load")

    # Initialize Firebase and load resources
    if not initialize_firebase():
        print("WARNING: Firebase initialization failed. Database features (History) will be disabled.")
        # Do not exit, allow the app to run without DB
    else:
        print("Firebase initialized successfully.")

    if not load_resources():
        print("CRITICAL ERROR: Model and class indices loading failed during app startup.")
        exit(1)
        
    app.run(debug=True, port=5000)

# --- Initialization for Render deployment (Gunicorn) ---
# This block will run when Gunicorn imports app.py as a module on Render.
if os.getenv("RENDER"): # Check if running on Render
    print("Detected Render environment. Performing production initialization...")

    if not initialize_firebase():
        print("CRITICAL ERROR: Firebase initialization failed for Render deployment.")

    if not load_resources():
        print("CRITICAL ERROR: Model and class indices loading failed for Render deployment.")
else:
    print("Not running on Render. Local initialization handled by __main__ block.")