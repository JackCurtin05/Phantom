"""
Grad-CAM implementation for EfficientNet.
Generates a heatmap highlighting the regions of the X-ray
that most influenced the model's prediction.
"""

import torch
import torch.nn.functional as F
import numpy as np
import cv2
from PIL import Image
import base64
import io


class GradCAM:
    """
    Hook-based Grad-CAM for any CNN model.
    Attach to the last convolutional feature block.
    """

    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model
        self.gradients = None
        self.activations = None

        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor: torch.Tensor, class_idx: int | None = None) -> tuple[np.ndarray, int]:
        """
        Run forward + backward pass and compute the CAM.
        Returns (cam array [0-1], predicted class index).
        """
        self.model.eval()

        output = self.model(input_tensor)
        probs = F.softmax(output, dim=1)

        if class_idx is None:
            class_idx = output.argmax(dim=1).item()

        self.model.zero_grad()
        output[0, class_idx].backward()

        # Global average pool the gradients over spatial dims
        weights = self.gradients.mean(dim=[2, 3], keepdim=True)

        # Weighted sum of activations
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = cam.squeeze().cpu().numpy()

        # Resize to input image size and normalize
        cam = cv2.resize(cam, (224, 224))
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-8:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)

        return cam, class_idx


def cam_to_heatmap(cam: np.ndarray, original_image: Image.Image) -> str:
    """
    Convert a Grad-CAM array to a base64-encoded PNG heatmap overlay.
    Returns a data URI string: 'data:image/png;base64,...'
    """
    # Apply JET colormap to CAM
    cam_uint8 = (cam * 255).astype(np.uint8)
    heatmap_bgr = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)

    # Resize original image to 224x224 for overlay
    orig_resized = original_image.resize((224, 224)).convert("RGB")
    orig_array = np.array(orig_resized, dtype=np.float32)

    # Blend: 55% original, 45% heatmap
    heatmap_float = heatmap_rgb.astype(np.float32)
    blended = (0.55 * orig_array + 0.45 * heatmap_float).clip(0, 255).astype(np.uint8)

    # Encode to base64 PNG
    pil_blended = Image.fromarray(blended)
    buffer = io.BytesIO()
    pil_blended.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return f"data:image/png;base64,{b64}"


def image_to_b64(image: Image.Image) -> str:
    """Convert a PIL image to base64 PNG data URI."""
    img_resized = image.resize((224, 224))
    buffer = io.BytesIO()
    img_resized.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"
