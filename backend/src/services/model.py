"""
Phantom model — multi-label chest X-ray classification.
Detects 14 conditions from the NIH ChestX-ray14 dataset simultaneously.
Uses sigmoid (not softmax) — each condition is an independent binary prediction.
"""

import torch
import torch.nn.functional as F
from torchvision import models
import os

from .gradcam import GradCAM

CONDITIONS = [
    'No Finding', 'Atelectasis', 'Cardiomegaly', 'Effusion',
    'Infiltration', 'Mass', 'Nodule', 'Pneumonia',
    'Consolidation', 'Edema', 'Emphysema', 'Fibrosis',
    'Pleural Thickening', 'Hernia'
]
NUM_CONDITIONS = len(CONDITIONS)

# Per-condition thresholds — F1-optimised on the NIH ChestX-ray14 validation set.
# Generated automatically by the training notebook (phantom_thresholds.json).
THRESHOLDS = {
    'No Finding':         0.500,
    'Atelectasis':        0.550,
    'Cardiomegaly':       0.425,
    'Effusion':           0.475,
    'Infiltration':       0.525,
    'Mass':               0.450,
    'Nodule':             0.525,
    'Pneumonia':          0.575,
    'Consolidation':      0.550,
    'Edema':              0.700,
    'Emphysema':          0.375,
    'Fibrosis':           0.425,
    'Pleural Thickening': 0.500,
    'Hernia':             0.675,
}

CONDITION_INFO = {
    'No Finding':         {'description': 'No significant abnormalities detected. Lung fields appear clear.',                                     'severity': 'none',     'color': 'green'},
    'Atelectasis':        {'description': 'Partial or complete collapse of lung tissue, reducing oxygen exchange.',                               'severity': 'moderate', 'color': 'amber'},
    'Cardiomegaly':       {'description': 'Enlarged cardiac silhouette, may indicate heart failure or other cardiac conditions.',                 'severity': 'moderate', 'color': 'amber'},
    'Effusion':           {'description': 'Excess fluid between the lung and chest wall (pleural effusion).',                                     'severity': 'moderate', 'color': 'amber'},
    'Infiltration':       {'description': 'Substance denser than air (fluid, pus, or blood) detected in lung tissue.',                           'severity': 'moderate', 'color': 'amber'},
    'Mass':               {'description': 'Abnormal opacity larger than 3cm. Requires follow-up to rule out malignancy.',                        'severity': 'high',     'color': 'red'},
    'Nodule':             {'description': 'Small round opacity (<3cm). May require monitoring depending on size and characteristics.',            'severity': 'moderate', 'color': 'amber'},
    'Pneumonia':          {'description': 'Lung infection causing consolidation and inflammation.',                                               'severity': 'high',     'color': 'red'},
    'Consolidation':      {'description': 'Lung tissue filled with fluid or pus instead of air, impairing gas exchange.',                        'severity': 'high',     'color': 'red'},
    'Edema':              {'description': 'Excess fluid accumulation in lung tissue, often from cardiac or renal causes.',                        'severity': 'high',     'color': 'red'},
    'Emphysema':          {'description': 'Damaged and enlarged air sacs reducing breathing efficiency, commonly from smoking.',                  'severity': 'moderate', 'color': 'amber'},
    'Fibrosis':           {'description': 'Scarring of lung tissue that progressively reduces lung capacity.',                                    'severity': 'moderate', 'color': 'amber'},
    'Pleural Thickening': {'description': 'Thickening of the pleural membrane surrounding the lungs.',                                           'severity': 'low',      'color': 'yellow'},
    'Hernia':             {'description': 'Organ or tissue displaced through an abnormal opening into the chest cavity.',                        'severity': 'moderate', 'color': 'amber'},
}

_model = None
_gradcam = None


def _build_model() -> torch.nn.Module:
    model = models.efficientnet_b4(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = torch.nn.Linear(in_features, NUM_CONDITIONS)
    return model


def load_model(model_path: str):
    global _model, _gradcam

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model not found at '{model_path}'. "
            "Train using training/Phantom_Train_Colab.ipynb and place phantom_model.pth in backend/models/."
        )

    model = _build_model()
    state = torch.load(model_path, map_location="cpu", weights_only=True)
    model.load_state_dict(state)
    model.eval()

    gradcam = GradCAM(model, model.features[-1])

    _model = model
    _gradcam = gradcam
    return model, gradcam


def get_model():
    if _model is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")
    return _model, _gradcam


def run_inference(input_tensor: torch.Tensor) -> dict:
    """
    Run multi-label inference. Returns confidence scores for all 14 conditions
    and a list of flagged conditions (above THRESHOLD).
    """
    model, _ = get_model()

    with torch.no_grad():
        logits = model(input_tensor)
        probs = torch.sigmoid(logits).squeeze(0)

    scores = {cond: round(float(probs[i]) * 100, 1) for i, cond in enumerate(CONDITIONS)}
    flagged = [cond for cond, score in scores.items() if score >= THRESHOLDS.get(cond, 0.25) * 100]

    # If nothing flagged, report as No Finding
    if not flagged:
        flagged = ['No Finding']

    # Primary condition = highest confidence among flagged (excluding No Finding if others present)
    non_normal_flagged = [c for c in flagged if c != 'No Finding']
    primary = max(non_normal_flagged, key=lambda c: scores[c]) if non_normal_flagged else 'No Finding'

    return {
        'primary': primary,
        'flagged': flagged,
        'scores': scores,
        'primary_info': CONDITION_INFO[primary],
        'primary_idx': CONDITIONS.index(primary),
    }
