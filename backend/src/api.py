"""
Phantom API — FastAPI backend for multi-label X-ray classification.

Endpoints:
    POST /api/analyze  — analyze an X-ray image, returns 14 condition scores
    GET  /api/health   — check model load status
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from services.model import load_model, run_inference, get_model, CONDITIONS
from services.preprocess import load_xray_image
from services.gradcam import cam_to_heatmap, image_to_b64

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "models/phantom_model.pth")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/tiff"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

model_loaded = False
model_error = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_loaded, model_error
    try:
        load_model(MODEL_PATH)
        model_loaded = True
        print(f"✅ Model loaded from {MODEL_PATH}")
    except FileNotFoundError as e:
        model_error = str(e)
        print(f"⚠️  Model not found: {e}")
    except Exception as e:
        model_error = str(e)
        print(f"❌ Failed to load model: {e}")
    yield


app = FastAPI(title="Phantom API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "model_error": model_error,
        "conditions": CONDITIONS,
    }


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Upload a JPEG or PNG X-ray image."
        )

    if not model_loaded:
        raise HTTPException(
            status_code=503,
            detail=model_error or "Model is not loaded. Train using the Colab notebook first."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum is 20 MB.")

    try:
        input_tensor, original_image = load_xray_image(file_bytes)
        result = run_inference(input_tensor)

        # Generate Grad-CAM for the primary flagged condition
        _, gradcam = get_model()
        input_for_cam = input_tensor.clone().requires_grad_(True)
        cam_array, _ = gradcam.generate(input_for_cam, class_idx=result["primary_idx"])
        heatmap_b64 = cam_to_heatmap(cam_array, original_image)
        original_b64 = image_to_b64(original_image)

        return {
            "primary": result["primary"],
            "primary_info": result["primary_info"],
            "flagged": result["flagged"],
            "scores": result["scores"],
            "original_image": original_b64,
            "heatmap_image": heatmap_b64,
            "disclaimer": (
                "For research and educational purposes only. "
                "Not a substitute for professional medical diagnosis."
            )
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
