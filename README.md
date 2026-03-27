# 👻 Phantom

**Chest X-ray classification powered by deep learning.**

Upload a chest X-ray — Phantom classifies it as Normal, Bacterial Pneumonia, or Viral Pneumonia, and generates a **Grad-CAM heatmap** showing exactly which regions of the image drove the prediction.

<!-- 📸 Hero screenshot here -->

> ⚠️ For research and educational purposes only. Not a substitute for professional medical diagnosis.

---

## Features

- 🧠 **EfficientNet-B0** fine-tuned on 5,800+ chest X-rays
- 🔥 **Grad-CAM heatmaps** — visual attention overlay on the X-ray
- 🩺 **3-class classification** — Normal · Bacterial Pneumonia · Viral Pneumonia
- 📊 **Confidence scores** for all three classes
- 🚦 **Severity indicator** — None / Moderate / High urgency
- 🖼 **Side-by-side viewer** — toggle between original and heatmap

---

## Screenshots

### Upload
<img width="3208" height="1798" alt="image" src="https://github.com/user-attachments/assets/cf67a97b-7845-4340-ba85-89fa2aca3a18" />

### Analysis Results
<img width="2720" height="1842" alt="image" src="https://github.com/user-attachments/assets/a6a6fca6-6151-485c-b704-9c6e2b14f50a" />

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A trained `phantom_model.pth` file (see Training below)

### 1. Clone the repo

```bash
git clone https://github.com/jackcurtin05/phantom.git
cd phantom
```

### 2. Train the model

Open the training notebook in Google Colab:

```
training/Phantom_Train_Colab.ipynb
```

1. Set runtime to **T4 GPU**
2. Add your Kaggle API key when prompted
3. Run all cells (~15 minutes)
4. Download `phantom_model.pth` and place it in `backend/models/`

### 3. Run the backend

```bash
cd backend
pip install -r requirements.txt
fastapi dev src/api.py
```

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## How It Works

1. **Upload** a chest X-ray (JPEG or PNG)
2. **EfficientNet-B0** runs inference — pretrained on ImageNet, fine-tuned on the Kaggle Chest X-Ray dataset
3. **Grad-CAM** computes gradients through the last convolutional block and generates a spatial attention heatmap
4. **Results** show the predicted class, per-class confidence scores, and a blended heatmap overlay

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | FastAPI, Python |
| Model | EfficientNet-B0 (PyTorch + torchvision) |
| Explainability | Grad-CAM (hook-based) |
| Image processing | Pillow, OpenCV |

---

## Training Data

[Chest X-Ray Images (Pneumonia)](https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia) by Paul Mooney on Kaggle.

- **5,863 images** across train/val/test splits
- **3 classes**: Normal, Bacterial Pneumonia, Viral Pneumonia
- Bacterial vs. Viral distinguished by filename (`_bacteria_` / `_virus_`)
- Weighted random sampling handles class imbalance during training

---

## Project Structure

```
phantom/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx        # Top nav
│       │   ├── ImageUpload.jsx   # Drag-and-drop upload
│       │   └── Results.jsx       # Prediction + heatmap viewer
│       └── App.jsx
└── backend/
    ├── models/                   # phantom_model.pth goes here
    └── src/
        ├── services/
        │   ├── model.py          # EfficientNet loader + inference
        │   ├── gradcam.py        # Grad-CAM + heatmap generation
        │   └── preprocess.py     # Image normalization
        └── api.py                # FastAPI endpoint
```

---

## License

MIT
