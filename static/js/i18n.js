/**
 * i18n Frontend Module
 * Handles language switching, translation loading, and UI updates
 */

class I18nManager {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.supportedLanguages = {
            'en': 'English',
            'hi': 'हिन्दी',
            'mr': 'मराठी',
            'ta': 'தமிழ்',
            'te': 'తెలుగు',
            'bn': 'বাংলা'
        };
    }

    /**
     * Initialize i18n system
     */
    async init() {
        try {
            // Detect language from backend
            const response = await fetch('/api/detect-language');
            const data = await response.json();
            this.currentLanguage = data.detected_language || 'en';

            // Load translations
            await this.loadTranslations(this.currentLanguage);

            // Apply translations to DOM
            this.applyTranslations();

            // Create language switcher
            this.createLanguageSwitcher();

            console.log(`✅ i18n initialized with language: ${this.currentLanguage}`);
        } catch (error) {
            console.error('Error initializing i18n:', error);
            // Fallback to English
            this.currentLanguage = 'en';
            await this.loadTranslations('en');
        }
    }

    /**
     * Load translations from backend
     */
    async loadTranslations(languageCode) {
        try {
            const response = await fetch(`/api/translations?lang=${languageCode}`);
            const translations = await response.json();
            this.translations = translations;
            this.currentLanguage = languageCode;
            return translations;
        } catch (error) {
            console.error(`Error loading translations for ${languageCode}:`, error);
            return {};
        }
    }

    /**
     * Get translated text for a key
     */
    t(key, defaultValue = key) {
        return this.translations[key] || defaultValue;
    }

    /**
     * Apply translations to all elements with data-i18n attribute
     */
    applyTranslations() {
        // Translate text content
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translatedText = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.placeholder) {
                    element.placeholder = translatedText;
                }
                if (element.type === 'button' || element.type === 'submit') {
                    element.value = translatedText;
                }
            } else {
                element.textContent = translatedText;
            }
        });

        // Translate option values in selects
        document.querySelectorAll('[data-i18n-option]').forEach(select => {
            const options = select.querySelectorAll('option[data-i18n]');
            options.forEach(option => {
                const key = option.getAttribute('data-i18n');
                option.textContent = this.t(key);
            });
        });

        // Translate titles and alt text
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Update HTML direction for RTL languages if needed
        this.updateTextDirection();
    }

    /**
     * Create language switcher dropdown
     */
    createLanguageSwitcher() {
        const navbar = document.querySelector('nav');
        if (!navbar) return;

        // Check if language switcher already exists
        if (document.getElementById('language-switcher-container')) {
            return;
        }

        // Create language switcher HTML
        const switcherHTML = `
            <div id="language-switcher-container" class="flex items-center ml-auto">
                <select id="language-select" class="bg-green-700 text-white px-3 py-2 rounded-lg hover:bg-green-800 focus:outline-none cursor-pointer font-medium transition-colors duration-200">
                    ${Object.entries(this.supportedLanguages)
                        .map(([code, name]) => 
                            `<option value="${code}" ${code === this.currentLanguage ? 'selected' : ''}>${name}</option>`
                        )
                        .join('')}
                </select>
            </div>
        `;

        // Find the navigation links container and insert before Emergency button
        const navLinks = navbar.querySelector('.space-x-4');
        if (navLinks) {
            navLinks.insertAdjacentHTML('beforebegin', switcherHTML);
        }

        // Add event listener
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.switchLanguage(e.target.value);
            });
        }
    }

    /**
     * Switch to a different language
     */
    async switchLanguage(languageCode) {
        if (!this.supportedLanguages[languageCode]) {
            console.error(`Unsupported language: ${languageCode}`);
            return;
        }

        try {
            // Save preference on backend
            await fetch('/api/language', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ language: languageCode })
            });

            // Load new translations
            await this.loadTranslations(languageCode);

            // Apply translations to DOM
            this.applyTranslations();

            // Update select value
            const select = document.getElementById('language-select');
            if (select) {
                select.value = languageCode;
            }

            console.log(`✅ Language switched to: ${languageCode}`);

            // Optionally reload page for complete translation
            // location.reload();
        } catch (error) {
            console.error('Error switching language:', error);
        }
    }

    /**
     * Update text direction for RTL languages
     */
    updateTextDirection() {
        const rtlLanguages = ['ar', 'he', 'ur']; // Add more RTL languages if needed
        const isRTL = rtlLanguages.includes(this.currentLanguage);
        
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.body.dir = isRTL ? 'rtl' : 'ltr';
    }

    /**
     * Translate disease name
     */
    translateDiseaseName(diseaseName, language = this.currentLanguage) {
        const diseaseMap = {
            'hi': {
                'apple': 'सेब',
                'blueberry': 'ब्लूबेरी',
                'cherry': 'चेरी',
                'corn': 'मक्का',
                'potato': 'आलू',
                'tomato': 'टमाटर'
            },
            'mr': {
                'apple': 'सफरचंद',
                'blueberry': 'नील बेरी',
                'corn': 'मक्का',
                'potato': 'बटाटा',
                'tomato': 'टोमॅटो'
            },
            'ta': {
                'apple': 'ஆப்பிள்',
                'blueberry': 'ப்ளூபெரி',
                'corn': 'சோளம்',
                'potato': 'உருளைக்கிழங்கு',
                'tomato': 'தக்காளி'
            }
        };

        const lowerName = diseaseName.toLowerCase();
        const translations = diseaseMap[language] || {};
        
        // Check for direct match
        if (translations[lowerName]) {
            return translations[lowerName];
        }

        // Check for partial match
        for (const [key, value] of Object.entries(translations)) {
            if (lowerName.includes(key)) {
                return diseaseName.replace(new RegExp(key, 'i'), value);
            }
        }

        return diseaseName;
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get all supported languages
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }
}

// Create global i18n instance
const i18n = new I18nManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});
