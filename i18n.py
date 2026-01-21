"""
Translation and Internationalization (i18n) Module
Handles language detection, translation loading, and geolocation-based language selection
"""

import json
import os
from functools import lru_cache
import requests
from flask import request, session

class TranslationManager:
    """Manages all translation operations for the application"""
    
    TRANSLATIONS_DIR = os.path.join(os.path.dirname(__file__), 'translations')
    SUPPORTED_LANGUAGES = {
        'en': 'English',
        'hi': 'हिन्दी (Hindi)',
        'mr': 'मराठी (Marathi)',
        'ta': 'தமிழ் (Tamil)',
        'te': 'తెలుగు (Telugu)',
        'bn': 'বাংলা (Bengali)'
    }
    
    # Geographic mapping for default language selection
    REGION_LANGUAGE_MAP = {
        'IN-MH': 'mr',  # Maharashtra - Marathi
        'IN-KA': 'kn',  # Karnataka - Kannada
        'IN-TN': 'ta',  # Tamil Nadu - Tamil
        'IN-AP': 'te',  # Andhra Pradesh - Telugu
        'IN-TS': 'te',  # Telangana - Telugu
        'IN-WB': 'bn',  # West Bengal - Bengali
        'IN-BR': 'hi',  # Bihar - Hindi
        'IN-UP': 'hi',  # Uttar Pradesh - Hindi
        'IN-HR': 'hi',  # Haryana - Hindi
    }
    
    @staticmethod
    @lru_cache(maxsize=32)
    def load_language_file(language_code):
        """Load translation JSON file for a specific language"""
        file_path = os.path.join(TranslationManager.TRANSLATIONS_DIR, f'{language_code}.json')
        
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                # Fallback to English if language file not found
                with open(os.path.join(TranslationManager.TRANSLATIONS_DIR, 'en.json'), 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading translation file for {language_code}: {e}")
            return {}
    
    @staticmethod
    def get_user_language():
        """
        Determine user's preferred language in this order:
        1. Session language (user-selected)
        2. Cookie language preference
        3. Geolocation-based language
        4. Browser language
        5. Default (English)
        """
        
        # Check session
        if 'language' in session:
            return session.get('language', 'en')
        
        # Check request args
        lang_param = request.args.get('lang')
        if lang_param and lang_param in TranslationManager.SUPPORTED_LANGUAGES:
            return lang_param
        
        # Try geolocation
        try:
            geo_lang = TranslationManager.detect_language_from_geolocation()
            if geo_lang:
                return geo_lang
        except Exception as e:
            print(f"Geolocation detection error: {e}")
        
        # Try browser language
        browser_lang = request.headers.get('Accept-Language', '')
        if browser_lang:
            # Parse Accept-Language header (e.g., "en-US,en;q=0.9,hi;q=0.8")
            languages = [lang.split('-')[0].lower() for lang in browser_lang.split(',')]
            for lang in languages:
                if lang in TranslationManager.SUPPORTED_LANGUAGES:
                    return lang
        
        return 'en'  # Default to English
    
    @staticmethod
    def detect_language_from_geolocation():
        """
        Detect language based on user's geographic location using free geolocation API
        """
        try:
            # Using ip-api.com free service (no API key required)
            client_ip = request.remote_addr
            
            # For development/localhost
            if client_ip in ['127.0.0.1', 'localhost', '::1']:
                return None
            
            response = requests.get(
                f'http://ip-api.com/json/{client_ip}',
                timeout=2
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if user is in India
                if data.get('country') == 'India':
                    state_code = data.get('region')
                    country_state = f"IN-{state_code}"
                    
                    # Return mapped language for the state
                    return TranslationManager.REGION_LANGUAGE_MAP.get(country_state, 'hi')
        
        except Exception as e:
            print(f"Geolocation API error: {e}")
        
        return None
    
    @staticmethod
    def translate(key, language_code='en'):
        """Get translated string for a key in specified language"""
        translations = TranslationManager.load_language_file(language_code)
        return translations.get(key, key)  # Return key if translation not found
    
    @staticmethod
    def get_all_translations(language_code='en'):
        """Get all translations for a language"""
        return TranslationManager.load_language_file(language_code)


class DiseaseTranslator:
    """Translate disease names and reports to user's language"""
    
    # Disease name translations
    DISEASE_TRANSLATIONS = {
        'en': {},  # English - no translation needed
        'hi': {
            'Apple': 'सेब',
            'Blueberry': 'ब्लूबेरी',
            'Cherry': 'चेरी',
            'Corn': 'मक्का',
            'Grape': 'अंगूर',
            'Orange': 'संतरा',
            'Peach': 'आड़ू',
            'Pepper': 'मिर्च',
            'Potato': 'आलू',
            'Raspberry': 'रास्पबेरी',
            'Soybean': 'सोयाबीन',
            'Squash': 'स्क्वैश',
            'Strawberry': 'स्ट्रॉबेरी',
            'Tomato': 'टमाटर',
            'healthy': 'स्वस्थ',
            'Black rot': 'काली सड़न',
            'Cedar rust': 'देवदार जंग',
            'Scab': 'पपड़ी',
            'Powdery mildew': 'पाउडरी मिल्ड्यू',
            'Leaf blight': 'पत्ती झुलसा',
            'Esca': 'एस्का',
            'Haunglongbing': 'हुआंगलांगबिंग',
            'Bacterial spot': 'बैक्टीरियल स्पॉट',
            'Leaf scorch': 'पत्ती स्कॉर्च',
            'Early blight': 'शुरुआती झुलसा',
            'Late blight': 'देर से झुलसा',
            'Septoria leaf spot': 'सेप्टोरिया पत्ती स्पॉट',
            'Target spot': 'लक्ष्य स्पॉट',
            'Mosaic virus': 'मोजेक वायरस',
            'Yellow leaf curl': 'पीली पत्ती कर्ल',
            'Spider mites': 'मकड़ी के घुन'
        },
        'mr': {
            'Apple': 'सफरचंद',
            'Blueberry': 'नील बेरी',
            'Cherry': 'चेरी',
            'Corn': 'मक्का',
            'Grape': 'द्राक्ष',
            'Orange': 'नारंगी',
            'Peach': 'आडू',
            'Pepper': 'मिरची',
            'Potato': 'बटाटा',
            'Raspberry': 'रसभरी',
            'Soybean': 'सोयाबीन',
            'Squash': 'स्क्वाश',
            'Strawberry': 'स्ट्रॉबेरी',
            'Tomato': 'टोमॅटो',
            'healthy': 'निरोगी',
            'Black rot': 'काळी कुजळी',
            'Cedar rust': 'देवदार गंजक',
            'Scab': 'कोड',
            'Powdery mildew': 'शेताळ',
            'Leaf blight': 'पानांचा झुलसा',
            'Esca': 'एस्का'
        },
        'ta': {
            'Apple': 'ஆப்பிள்',
            'Blueberry': 'ப்ளூபெரி',
            'Cherry': 'சேரி',
            'Corn': 'சோளம்',
            'Grape': 'திராட்சை',
            'Orange': 'ஆரஞ்சு',
            'Peach': 'பீச்',
            'Pepper': 'மிளகு',
            'Potato': 'உருளைக்கிழங்கு',
            'Raspberry': 'ரேஸ்பெரி',
            'Soybean': 'சோயாபீன்',
            'Squash': 'கோல்',
            'Strawberry': 'நீதிக்கொட்டை',
            'Tomato': 'தக்காளி',
            'healthy': 'ஆரோக்கியமான',
            'Black rot': 'கருப்பு அழுகல்',
            'Cedar rust': 'தேவதாரு அரிப்பு'
        },
        'te': {
            'Apple': 'ఆపిల్',
            'Blueberry': 'బ్లూబెర్రీ',
            'Cherry': 'చెర్రీ',
            'Corn': 'మకా',
            'Grape': 'ద్రాక్ష',
            'Orange': 'నారింజ',
            'Peach': 'పీచ్',
            'Pepper': 'మిరిపప్పు',
            'Potato': 'బంతులు',
            'Raspberry': 'రాస్‌బెర్రీ',
            'Soybean': 'సోయాబీన్',
            'Squash': 'స్కాష్',
            'Strawberry': 'స్ట్రాబెర్రీ',
            'Tomato': 'టమాటా',
            'healthy': 'ఆరోగ్యకరమైన'
        },
        'bn': {
            'Apple': 'আপেল',
            'Blueberry': 'ব্লুবেরি',
            'Cherry': 'চেরি',
            'Corn': 'ভুট্টা',
            'Grape': 'আঙ্গুর',
            'Orange': 'কমলা',
            'Peach': 'পীচ',
            'Pepper': 'মরিচ',
            'Potato': 'আলু',
            'Raspberry': 'রাস্পবেরি',
            'Soybean': 'সয়াবিন',
            'Squash': 'স্কোয়াশ',
            'Strawberry': 'স্ট্রবেরি',
            'Tomato': 'টমেটো',
            'healthy': 'সুস্থ'
        }
    }
    
    @staticmethod
    def translate_disease_name(disease_name, language_code='en'):
        """Translate disease name if available"""
        if language_code == 'en' or language_code not in DiseaseTranslator.DISEASE_TRANSLATIONS:
            return disease_name
        
        translations = DiseaseTranslator.DISEASE_TRANSLATIONS[language_code]
        
        # Try exact match first
        if disease_name in translations:
            return translations[disease_name]
        
        # Try partial match for compound words
        for key, value in translations.items():
            if key.lower() in disease_name.lower():
                return disease_name.replace(key, value)
        
        return disease_name


def set_user_language(language_code):
    """Set user's language preference in session"""
    if language_code in TranslationManager.SUPPORTED_LANGUAGES:
        session['language'] = language_code
        return True
    return False
