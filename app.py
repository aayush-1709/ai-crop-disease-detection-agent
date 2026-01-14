import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import base64
import io

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
        if not firebase_config_json:
            print("CRITICAL ERROR: FIREBASE_CONFIG_JSON environment variable not set.")
            print("Please ensure your Firebase service account key JSON is set as an environment variable on Render.")
            return False

        cred = credentials.Certificate(json.loads(firebase_config_json))
        print("Using FIREBASE_CONFIG_JSON environment variable for Firebase initialization.")

        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        print(f"Firebase initialized successfully. db object is: {db}")
        return True
    except Exception as e:
        print(f"Failed to initialize Firebase: {e}")
        import traceback
        traceback.print_exc()
        return False

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

        prompt = f"""
        Act as an expert agronomist and plant pathologist for a user in India.

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
    user_context = data.get('user_context', {})

    if not disease_name:
        return jsonify({"error": "Disease name is required for diagnosis"}), 400

    final_report = get_gemini_diagnosis(disease_name, user_context)
    return jsonify({"report": final_report})

# --- History Endpoint ---
@app.route('/history', methods=['GET'])
def get_history():
    if not db:
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

# --- Frontend Routes ---
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/history_page')
def history_page():
    return render_template('history.html')

@app.route('/user_guide')
def user_guide():
    return render_template('user_guide.html') # Assuming user_guide.html is the correct filename

@app.route('/tools')
def tools_page():
    return render_template('tools.html')

if __name__ == '__main__':
    # This block is for local development only, It will NOT run when Gunicorn imports app.py on Render.
    print("Starting Flask server for local development...")

    # Initialize Firebase and load resources
    if not initialize_firebase():
        print("CRITICAL ERROR: Firebase initialization failed during app startup.")
        exit(1)

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

