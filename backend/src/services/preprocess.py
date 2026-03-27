"""
Image preprocessing for X-ray analysis.
Handles grayscale X-rays, JPEG/PNG inputs, and normalization
to match the ImageNet stats used during EfficientNet training.
"""

import torch
from torchvision import transforms
from PIL import Image
import io

# ImageNet mean/std — used even for grayscale X-rays
# since we convert to 3-channel RGB for EfficientNet
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224

preprocess = transforms.Compose([
    transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


def load_xray_image(file_bytes: bytes) -> tuple[torch.Tensor, Image.Image]:
    """
    Load X-ray image bytes → (preprocessed tensor, original PIL image).
    Converts grayscale to RGB so EfficientNet input channels match.
    Returns (tensor of shape [1, 3, 224, 224], PIL image).
    """
    image = Image.open(io.BytesIO(file_bytes))

    # Convert to RGB — handles grayscale, RGBA, or already-RGB
    image_rgb = image.convert("RGB")

    tensor = preprocess(image_rgb).unsqueeze(0)  # [1, 3, 224, 224]
    return tensor, image_rgb
