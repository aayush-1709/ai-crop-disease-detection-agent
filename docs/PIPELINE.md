# 🧠 Diagnostic Pipeline & State Machine

The AI Crop Doctor doesn't just rely on an image; it uses a **Hybrid Diagnostic Pipeline** to increase accuracy through user interaction.

## 🔄 The 4-Stage Workflow

### 1. Visual Feature Extraction
The image is passed through the `.tflite` model. The output is a probability distribution across 38 classes.

### 2. Confidence Check
- **IF** Top Prediction Probability $> 0.85$ $\rightarrow$ **Immediate Diagnosis.**
- **IF** Top Prediction Probability $< 0.85$ $\rightarrow$ **Trigger Interactive Q&A.**

### 3. Contextual State Machine (Q&A)
Depending on the *potential* disease identified by the CNN, the system triggers specific questions:

| Potential Disease | Follow-up Question | Weight Adjustment |
| :--- | :--- | :--- |
| **Late Blight** | "Is the weather currently humid or rainy?" | +15% Confidence |
| **Spider Mites** | "Do you see tiny webs on the undersides of leaves?" | +20% Confidence |
| **Yellow Leaf Curl** | "Are there whiteflies visible around the plant?" | +10% Confidence |

### 4. Weighted Final Diagnosis
The final score is calculated using a simple Bayesian-inspired weight:
$$Final Score = (Model Confidence \times 0.7) + (User Input Weight \times 0.3)$$

## 🛠️ Error Handling
- **Ambiguous Inputs:** If two diseases have similar scores, the Q&A will prioritize questions that "differentiate" between those two specific symptoms.
- **OOD Response:** If the OOD layer triggers, the pipeline halts and prompts the user: *"No leaf detected. Please ensure the leaf is centered and well-lit."*
