# 🔬 Model Documentation & Versioning

This document provides technical details about the AI engine powering the Crop Doctor.

## 🏗️ Architecture Overview
The current model is a **lightweight CNN (Convolutional Neural Network)** optimized for mobile and web deployment.

- **Base Model:** MobileNetV2 (Transfer Learning)
- **Framework:** TensorFlow / Keras
- **Export Format:** `.tflite` (TensorFlow Lite)
- **Optimization:** Float16 Quantization for faster inference.

## 📊 Technical Specifications
| Parameter | Value |
| :--- | :--- |
| **Input Shape** | `(224, 224, 3)` |
| **Color Space** | RGB |
| **Normalization** | 1/255.0 scaling |
| **Classes** | 38 (based on PlantVillage dataset) |
| **Primary Dataset** | [PlantVillage](https://github.com/spMohanty/PlantVillage-Dataset) |

## 🛡️ Out of Distribution (OOD) Strategy
To ensure the model doesn't give false diagnoses for non-leaf images:
- **Entropy Thresholding:** If the prediction entropy is too high (indicating uncertainty across all classes), the image is flagged.
- **Background Filter:** We check for specific green/brown pixel density to verify the presence of organic plant tissue before processing.

## 📈 Model Versioning
- **v1.0.0:** Basic CNN, trained on Tomato classes only.
- **v1.0.1:** Added MobileNetV2 base, expanded to 15 crops.
- **v1.0.2 (Current):** Integrated TFLite support and optimized for Edge deployment.
