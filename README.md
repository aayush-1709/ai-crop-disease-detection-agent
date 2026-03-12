# 🌱 AI Crop Doctor

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Inter&size=28&pause=1200&center=true&vCenter=true&width=600&lines=Detect+early%2C+protect+fully+%F0%9F%8C%B1;AI+powered+plant+disease+diagnosis;Your+digital+crop+health+assistant" alt="Typing Animation" />
</p>

---

## 📖 About the Project

**AI Crop Doctor** is an AI-powered web application that helps farmers, gardeners, and agricultural experts **identify plant diseases from leaf images**. By combining **machine learning image analysis** with **context-based follow-up questions**, it delivers **accurate diagnoses** and **practical treatment suggestions**.

### How it works

1. **Upload** an image of your plant or leaf (drag-and-drop or click to select)  
2. **Answer** a few simple questions about symptoms and conditions  
3. **Receive** a confidence-based disease diagnosis and actionable recommendations  

### Key Highlights

- 📸 **AI Image Recognition** for plant disease detection
- 🧭 **Interactive Q\&A** for improved accuracy
- 📊 **Confidence Scores** for transparency
- 📱 **Fully Responsive** and mobile-friendly design
- 🎯 **Actionable Recommendations** to help protect crops

---

## 🧑‍🌾 Step-by-Step Usage Guide

Follow these simple steps to use AI Crop Doctor effectively:

1. Open the AI Crop Doctor web application in your browser.
2. Upload a clear image of the affected plant leaf using drag-and-drop or file selection.
3. Ensure the image is well-lit and focused for accurate analysis.
4. Click on the **Analyze Image** button to start the diagnosis.
5. Answer the follow-up questions related to plant condition and symptoms.
6. Wait a few seconds while the AI processes the image.
7. View the detected disease along with confidence score and treatment recommendations.

---

## 🗂 Project Structure
```bash
📁 ai-crop-disease-detection-agent/
│__📄 app.py
│__📄 class_indices.json
│__📄 crop_diagnosis_best_model.tflite
│__📄 README.md
│__📄 requirements.txt
│__📄 .gitattributes
│__📄 .gitignore
│
├───📁 static/
│ ├───📁 css/
│ │   |___📄 style.css
│ ├───📁 images/
│ │   |___📄 apple_black-rot.JPG
│ │   |___📄 apple_cedar_rust.JPG
│ │   |___📄 apple_healthy.JPG
│ │   |___... 📄 (35 more sample images)
│ └───📁 js/
│ |   |___📄 history.js
│ |   |___📄 main.js
│ |   |___📄 user_guide.js
| |   |___📄 auth.js
| |   |___📄 user_guide.js
| |   |___📄 emergency.js
│
└───📁 templates/
| |___📄 history.html
| |___📄 index.html
| |___📄 tools.html
| |___📄 user_guide.html
```

---

## ⚡ Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/ai-crop-disease-detection-agent.git

cd ai-crop-disease-detection-agent
```
2. Install dependencies:
```bash
pip install -r requirements.txt
```
3. Run the application:
```bash
python app.py
```
4. Open your browser and go to:
```bash
http://127.0.0.1:5000
```

🤝 Contributing

Contributions are welcome!
- Fork the repository
- Create a new branch `git checkout -b feature-name`
- Make your changes
- Push to your branch `git push origin feature-name`
- Open a Pull Request
Read the [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md) and [Contribution](Contribution.md) for further details.

📄 License

This project is MIT licensed. View [LICENSE](LICENSE)

<p align="center"> <img src="https://capsule-render.vercel.app/api?type=waving&color=0:22c55e,100:16a34a&height=100&section=footer" alt="Wave Animation" /> </p> 
