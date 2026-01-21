import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
import base64
import io

# Uncomment these if Firebase credentials are available
# import firebase_admin
# from firebase_admin import credentials, firestore

# Import your i18n modules
from i18n import TranslationManager, DiseaseTranslator, set_user_language

# --- Flask App Setup ---
app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)
app.secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

# --- Configuration ---
IMG_HEIGHT = 128
IMG_WIDTH = 128

MODEL_FILENAME = 'crop_diagnosis_best_model.tflite'
CLASS_INDICES_FILENAME = os.path.join(os.getcwd(), 'class_indices.json')

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Global variables ---
model = None
class_labels = None
# db = None  # Firebase DB is commented out for contribution without credentials

# --- Load Model and Class Indices ---
def load_resources():
    global model, class_labels
    print("Loading model and class indices...")

    if not os.path.exists(MODEL_FILENAME):
        print("Model file not found.")
        return False

    if not os.path.exists(CLASS_INDICES_FILENAME):
        print("class_indices.json not found.")
        return False

    interpreter = tf.lite.Interpreter(model_path=MODEL_FILENAME)
    interpreter.allocate_tensors()
    model = interpreter

    with open(CLASS_INDICES_FILENAME, 'r') as f:
        class_indices = json.load(f)

    class_labels = {v: k for k, v in class_indices.items()}

    print("Model loaded successfully.")
    return True

# --- Gemini Integration with Multi-language Support ---
def get_gemini_diagnosis(disease_name, user_context, language_code='en'):
    if not GEMINI_API_KEY:
        return "Gemini API key not set."

    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    
    # Translate disease name if needed
    translated_disease = DiseaseTranslator.translate_disease_name(
        disease_name.replace('_', ' '), 
        language_code
    )

    # Language-specific instructions
    language_instructions = {
        'en': 'Act as an expert agronomist for Indian farmers.',
        'hi': 'भारतीय किसानों के लिए एक विशेषज्ञ कृषि विशेषज्ञ के रूप में कार्य करें।',
        'mr': 'भारतीय शेतकऱ्यांसाठी एक तज्ञ कृषीविद म्हणून काम करा।',
        'ta': 'இந்திய விவசாயிgளுக்கான ஆலோசகம் நிபுணராக செயல்பட வேண்டும்.',
        'te': 'భారతీయ రైతుల కోసం ఒక నిపుణ కృషిశాస్త్రవేత్తగా పనిచేయండి.',
        'bn': 'ভারতীয় কৃষকদের জন্য একজন বিশেষজ্ঞ কৃষিবিজ্ঞানী হিসাবে কাজ করুন।'
    }

    language_prompt = language_instructions.get(language_code, language_instructions['en'])

    prompt = f"""
    {language_prompt}

    Disease detected: {translated_disease}

    Symptoms: {user_context}

    Provide:
    1. Diagnosis
    2. Organic Treatment
    3. Chemical Treatment
    4. Prevention
    """

    response = gemini_model.generate_content(prompt)
    return response.text

# --- Prediction Endpoint ---
@app.route('/predict', methods=['POST'])
def predict():
    if not model or not class_labels:
        return jsonify({"error": "Model not loaded"}), 500

    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files['image']
    img_bytes = file.read()
    img_stream = io.BytesIO(img_bytes)

    img = image.load_img(img_stream, target_size=(IMG_HEIGHT, IMG_WIDTH))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0).astype(np.float32) / 255.0

    input_details = model.get_input_details()
    output_details = model.get_output_details()

    model.set_tensor(input_details[0]['index'], img_array)
    model.invoke()

    prediction = model.get_tensor(output_details[0]['index'])

    predicted_class_index = np.argmax(prediction[0])
    confidence = np.max(prediction[0]) * 100
    predicted_class_name = class_labels[predicted_class_index]

    # Firebase logging is commented out
    # if db:
    #     history_ref = db.collection('predictions')
    #     history_ref.add({
    #         'timestamp': firestore.SERVER_TIMESTAMP,
    #         'image_base64': base64.b64encode(img_bytes).decode('utf-8'),
    #         'predicted_class_name': predicted_class_name,
    #         'confidence': float(confidence)
    #     })

    return jsonify({
        "predicted_class_name": predicted_class_name,
        "confidence": float(confidence)
    })

# --- Gemini Diagnosis Endpoint ---
@app.route('/get_diagnosis', methods=['POST'])
def get_diagnosis():
    data = request.get_json()

    disease_name = data.get('disease_name')
    user_context = data.get('user_context', {})
    language_code = data.get('language', 'en')

    report = get_gemini_diagnosis(disease_name, user_context, language_code)

    return jsonify({"report": report})

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
    return render_template('user_guide.html')

@app.route('/tools')
def tools_page():
    return render_template('tools.html')

# --- Internationalization (i18n) Routes ---
@app.route('/api/translations')
def get_translations():
    language_code = request.args.get('lang', 'en')
    translations = TranslationManager.get_all_translations(language_code)
    return jsonify(translations)

@app.route('/api/language', methods=['GET', 'POST'])
def language_management():
    if request.method == 'POST':
        data = request.get_json()
        language_code = data.get('language', 'en')
        
        if set_user_language(language_code):
            return jsonify({
                "success": True,
                "language": language_code,
                "message": "Language preference updated"
            })
        else:
            return jsonify({
                "success": False,
                "message": "Invalid language code"
            }), 400
    
    else:  # GET request
        current_language = TranslationManager.get_user_language()
        supported_languages = TranslationManager.SUPPORTED_LANGUAGES
        
        return jsonify({
            "current_language": current_language,
            "supported_languages": supported_languages,
            "language_list": list(supported_languages.items())
        })

@app.route('/api/detect-language')
def detect_language():
    detected_language = TranslationManager.get_user_language()
    
    return jsonify({
        "detected_language": detected_language,
        "language_name": TranslationManager.SUPPORTED_LANGUAGES.get(detected_language, "English")
    })

# --- Run App ---
if __name__ == '__main__':
    print("Starting Flask server...")
    load_resources()
    app.run(debug=True, port=5000)
