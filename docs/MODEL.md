# 🔬 AI Crop Doctor - Model Documentation

## 🏗 Model Architecture
- **Base Model:** MobileNetV2 (Transfer Learning)
- **Input Size:** 224x224x3 (RGB)
- **Output:** Softmax Layer (38 Classes)

## 📊 Dataset Metadata
- **Source:** PlantVillage Dataset
- **Images:** 54,303 healthy and diseased leaf images.
- **Classes:** Includes Tomato, Potato, Apple, Corn, and Grape.

## 🧠 Diagnostic Pipeline
1. **Feature Extraction:** CNN identifies visual patterns (spots, wilting, color).
2. **Confidence Threshold:** If the top prediction is below 0.8, the **Interactive Q&A** is triggered.
3. **Contextual Adjustment:** Q&A answers (e.g., "Humidity level," "Soil type") act as weights to refine the final output.

## 🛡 Out of Distribution (OOD) Handling
To prevent false positives, we implement an **Image Classifier Filter** that checks for the presence of a leaf. If the probability of "Plant" is below 0.7, the analysis is aborted to save compute resources.
