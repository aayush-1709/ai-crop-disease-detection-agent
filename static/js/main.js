document.addEventListener('DOMContentLoaded', () => {
    // --- Elements for Step 1: Upload ---
    const imageInput = document.getElementById('image-input');
    const dropArea = document.getElementById('drop-area');
    const imagePreviewContainerInitial = document.getElementById('image-preview-container-initial');
    const imagePreviewInitial = document.getElementById('image-preview-initial');
    const imageNameInitial = document.getElementById('image-name-initial');
    const predictButton = document.getElementById('predict-button');
    const uploadSection = document.getElementById('upload-section');
    const loadingSpinnerInitial = document.getElementById('loading-spinner-initial');

    // UI control sections
    const introSampleSection = document.getElementById('intro-sample-section');
    const mainAppSection = document.getElementById('main-app-section');

    // --- Elements for Disease Detection Section ---
    const diseaseDetectionSection = document.getElementById('disease-detection-section');
    const getDetailedDiagnosisTopButton = document.getElementById('get-detailed-diagnosis-top-button');
    const predictionResult = document.getElementById('prediction-result');
    const confidenceBar = document.getElementById('confidence-bar');
    const confidenceScoreText = document.getElementById('confidence-score-text');
    const imagePreviewSummary = document.getElementById('image-preview-summary');
    const imageNameSummary = document.getElementById('image-name-summary');

    // --- Elements for Additional Information Section ---
    const additionalInfoSection = document.getElementById('additional-info-section');
    const additionalInfoContent = document.getElementById('additional-info-content'); // Content div within additionalInfoSection

    // Dropdown elements for detailed questionnaire
    const leafDiscolorationSelect = document.getElementById('leaf-discoloration');
    const wiltingDroppingSelect = document.getElementById('wilting-dropping');
    const recentWeatherSelect = document.getElementById('recent-weather');
    const temperatureConditionSelect = document = document.getElementById('temperature-condition');
    const recentFertilizerSelect = document.getElementById('recent-fertilizer');
    const previousPesticideSelect = document.getElementById('previous-pesticide');
    const insectsObservedSelect = document.getElementById('insects-observed');
    const evidenceOfDamageSelect = document.getElementById('evidence-of-damage');
    const wateringFrequencySelect = document.getElementById('watering-frequency');
    const plantAgeGrowthSelect = document.getElementById('plant-age-growth');

    const getReportButton = document.getElementById('get-report-button');
    const loadingSpinnerReport = document.getElementById('loading-spinner-report');
    const loadingTextReport = document.getElementById('loading-text-report');

    // --- Elements for AI Report Section (now standalone) ---
    const reportSectionStandalone = document.getElementById('report-section-standalone');
    const finalReportContent = document.getElementById('final-report-content');
    const startOverButton = document.getElementById('start-over-button');

    // --- General Elements ---
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const sampleImageCards = document.querySelectorAll('.sample-image-card');

    let predictedDiseaseName = '';
    let currentImageFile = null;
    let currentConfidence = 0;

    // Function to show error message
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    // Function to hide error message
    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Function to reset the form to initial state
    function resetForm() {
        // Show initial upload section and hide others
        uploadSection.classList.remove('hidden');
        diseaseDetectionSection.classList.add('hidden'); // Hide disease detection
        additionalInfoSection.classList.add('hidden'); // Hide additional info section (including header)
        reportSectionStandalone.classList.add('hidden'); // Hide standalone report
        loadingSpinnerInitial.classList.add('hidden');
        loadingSpinnerReport.classList.add('hidden');
        hideError();

        // Ensure additional info content and button are shown on reset
        additionalInfoContent.classList.remove('hidden');
        getReportButton.classList.remove('hidden');


        // Reset UI elements
        imageInput.value = '';
        imagePreviewContainerInitial.classList.add('hidden');
        imagePreviewInitial.src = '';
        imageNameInitial.textContent = '';
        predictButton.disabled = true;

        // Reset dropdowns
        leafDiscolorationSelect.value = '';
        wiltingDroppingSelect.value = '';
        recentWeatherSelect.value = '';
        temperatureConditionSelect.value = '';
        recentFertilizerSelect.value = '';
        previousPesticideSelect.value = '';
        insectsObservedSelect.value = '';
        evidenceOfDamageSelect.value = '';
        wateringFrequencySelect.value = '';
        plantAgeGrowthSelect.value = '';

        predictionResult.textContent = '';
        confidenceBar.style.width = '0%'; // Reset confidence bar
        confidenceScoreText.textContent = ''; // Reset confidence score text
        finalReportContent.innerHTML = ''; // Clear report content
        predictedDiseaseName = '';
        currentImageFile = null;
        currentConfidence = 0;

        // Reset loading text for both spinners
        loadingSpinnerInitial.querySelector('p').textContent = "Analyzing your image...";
        loadingTextReport.textContent = "Generating your personalized report...";

        // Reset layout: show intro/sample section. main-app-section is already w-full
        introSampleSection.classList.remove('hidden');
    }

    // Function to handle file processing (for both input change and drag-drop)
    function handleFile(file) {
        hideError();
        if (file && file.type.startsWith('image/')) {
            currentImageFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreviewInitial.src = e.target.result;
                imagePreviewSummary.src = e.target.result; // Set for summary image too
                imagePreviewContainerInitial.classList.remove('hidden');
                imageNameInitial.textContent = file.name;
                imageNameSummary.textContent = file.name; // Set for summary name too
                predictButton.disabled = false;
            };
            reader.readAsDataURL(file);

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files;

        } else {
            imagePreviewContainerInitial.classList.add('hidden');
            imagePreviewInitial.src = '';
            imageNameInitial.textContent = '';
            predictButton.disabled = true;
            currentImageFile = null;
            if (file) {
                showError("Please upload a valid image file (JPG, PNG, GIF).");
            }
        }
    }

    // Handle image file selection (traditional input)
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        handleFile(file);
    });

    // Handle sample image click
    sampleImageCards.forEach(card => {
        card.addEventListener('click', async () => {
            hideError();
            const imagePath = card.dataset.imagePath;
            const imageNameText = card.dataset.imageName;

            try {
                const response = await fetch(imagePath);
                const blob = await response.blob();
                const file = new File([blob], imageNameText, { type: blob.type });
                handleFile(file);
            } catch (error) {
                showError("Failed to load sample image. Please try again.");
                console.error("Error loading sample image:", error);
            }
        });
    });

    // Handle click on drop area to trigger file input
    dropArea.addEventListener('click', () => {
        imageInput.click();
    });

    // Drag and Drop Event Listeners
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropArea.addEventListener('dragenter', highlight, false);
    dropArea.addEventListener('dragover', highlight, false);
    dropArea.addEventListener('dragleave', unhighlight, false);
    dropArea.addEventListener('drop', handleDrop, false);

    function highlight() {
        dropArea.classList.add('border-green-500', 'bg-green-50');
    }

    function unhighlight() {
        dropArea.classList.remove('border-green-500', 'bg-green-50');
    }

    function handleDrop(e) {
        unhighlight();
        const dt = e.dataTransfer;
        const file = dt.files[0];

        handleFile(file);
    }


    // Handle Predict button click (Initial Analysis)
    predictButton.addEventListener('click', async () => {
        hideError();
        if (!currentImageFile) {
            showError("Please select or drop an image first.");
            return;
        }

        const formData = new FormData();
        formData.append('image', currentImageFile);

        uploadSection.classList.add('hidden');
        loadingSpinnerInitial.classList.remove('hidden');

        // UI change: Hide intro/sample section.
        introSampleSection.classList.add('hidden');


        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Prediction failed.');
            }

            const data = await response.json();
            predictedDiseaseName = data.predicted_class_name;
            currentConfidence = data.confidence; // Store confidence

            predictionResult.innerHTML = `<span class="font-bold text-blue-800">${predictedDiseaseName.replace(/_/g, ' ')}</span>`;
            confidenceBar.style.width = `${currentConfidence}%`; // Update confidence bar width
            confidenceScoreText.textContent = `${currentConfidence.toFixed(2)}%`; // Update confidence score text

            loadingSpinnerInitial.classList.add('hidden');
            diseaseDetectionSection.classList.remove('hidden'); // Show disease detection section
            additionalInfoSection.classList.remove('hidden'); // Show additional info section
            
            // Ensure the summary image and name are visible in the disease detection section
            imagePreviewSummary.src = imagePreviewInitial.src;
            imageNameSummary.textContent = imageNameInitial.textContent;

        } catch (error) {
            console.error('Error:', error);
            loadingSpinnerInitial.classList.add('hidden');
            uploadSection.classList.remove('hidden'); // Show upload section again
            showError(`Failed to get prediction: ${error.message}`);
            // Reset layout if prediction fails
            introSampleSection.classList.remove('hidden');
        }
    });

    // Handle Get Report button click (Detailed Report Generation)
    getReportButton.addEventListener('click', async () => {
        hideError();
        const userContext = {
            leaf_discoloration: leafDiscolorationSelect.value,
            wilting_dropping: wiltingDroppingSelect.value,
            recent_weather: recentWeatherSelect.value,
            temperature_condition: temperatureConditionSelect.value,
            recent_fertilizer: recentFertilizerSelect.value,
            previous_pesticide: previousPesticideSelect.value,
            insects_observed: insectsObservedSelect.value,
            evidence_of_damage: evidenceOfDamageSelect.value,
            watering_frequency: wateringFrequencySelect.value,
            plant_age_growth: plantAgeGrowthSelect.value,
        };

        // Hide the "Additional Information" section (including its header) and the "Get AI Diagnosis" button
        additionalInfoSection.classList.add('hidden');
        getReportButton.classList.add('hidden');

        loadingSpinnerReport.classList.remove('hidden'); // Show the dedicated report spinner
        getReportButton.disabled = true; // Disable button during loading

        try {
            const response = await fetch('/get_diagnosis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    disease_name: predictedDiseaseName,
                    user_context: userContext,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Diagnosis failed.');
            }

            const data = await response.json();
            // Use marked.js to convert Markdown to HTML
            finalReportContent.innerHTML = marked.parse(data.report);

            loadingSpinnerReport.classList.add('hidden');
            reportSectionStandalone.classList.remove('hidden'); // Show the standalone report section

        } catch (error) {
            console.error('Error:', error);
            loadingSpinnerReport.classList.add('hidden');
            // If error, show "Additional Information" section and "Get AI Diagnosis" button again
            additionalInfoSection.classList.remove('hidden');
            getReportButton.classList.remove('hidden');
            showError(`Failed to get report: ${error.message}`);
        } finally {
            getReportButton.disabled = false; // Re-enable button
        }
    });

    // Handle Start Over button click
    startOverButton.addEventListener('click', () => {
        resetForm();
    });

    // Handle top "Get Detailed Diagnosis" button click
    getDetailedDiagnosisTopButton.addEventListener('click', () => {
        // This button acts as a shortcut to the detailed report generation
        // It will trigger the same logic as the main getReportButton
        getReportButton.click();
    });


    // Initialize form state
    resetForm();
});
