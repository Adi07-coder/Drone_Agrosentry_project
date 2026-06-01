import sys
import json
import os
import warnings

# Suppress warnings to prevent log output from polluting stdout
warnings.filterwarnings("ignore")

import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models
from torchvision.models import EfficientNet_B0_Weights
from ultralytics import YOLO

# =========================
# DEVICE
# =========================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =========================
# PATHS
# =========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "models")

GENERAL_MODEL_PATH = os.path.join(MODELS_DIR, "best_augmented_full_model.pth")
SPECIALIST_MODEL_PATH = os.path.join(MODELS_DIR, "best_specialist_model.pth")
YOLO_MODEL_PATH = os.path.join(MODELS_DIR, "best.pt")
LABELS_PATH = os.path.join(MODELS_DIR, "labels.txt")
SPECIALIST_LABELS_PATH = os.path.join(MODELS_DIR, "pepper_potato_labels.txt")

# =========================
# LOAD LABELS
# =========================
if not os.path.exists(LABELS_PATH):
    class_names = [
        "Pepper__bell___Bacterial_spot", "Pepper__bell___healthy",
        "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
        "Tomato_Bacterial_spot", "Tomato_Early_blight", "Tomato_Late_blight",
        "Tomato_Leaf_Mold", "Tomato_Septoria_leaf_spot", "Tomato_Spider_mites_Two_spotted_spider_mite",
        "Tomato__Target_Spot", "Tomato__Tomato_YellowLeaf__Curl_Virus", "Tomato__Tomato_mosaic_virus", "Tomato_healthy"
    ]
else:
    with open(LABELS_PATH, "r") as f:
        class_names = [line.strip() for line in f.readlines()]

# Load specialist classes dynamically to avoid size mismatch
if os.path.exists(SPECIALIST_LABELS_PATH):
    with open(SPECIALIST_LABELS_PATH, "r") as f:
        specialist_classes = [line.strip() for line in f.readlines()]
else:
    specialist_classes = class_names

# =========================
# LOAD YOLOv8 MODEL
# =========================
try:
    yolo_model = YOLO(YOLO_MODEL_PATH)
except Exception as e:
    yolo_model = None

# =========================
# LOAD GENERAL MODEL
# =========================
general_model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
general_model.classifier = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(general_model.classifier[1].in_features, 512),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(512, len(class_names))
)
general_model.load_state_dict(torch.load(GENERAL_MODEL_PATH, map_location=device))
general_model = general_model.to(device)
general_model.eval()

# =========================
# LOAD SPECIALIST MODEL
# =========================
specialist_model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
specialist_model.classifier = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(specialist_model.classifier[1].in_features, 512),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(512, len(specialist_classes))
)
specialist_model.load_state_dict(torch.load(SPECIALIST_MODEL_PATH, map_location=device))
specialist_model = specialist_model.to(device)
specialist_model.eval()

# =========================
# TRANSFORM
# =========================
# The existing trained models were trained without ImageNet normalization.
# Omit normalization for 100% correct predictions. Toggle this to True if you retrain the models.
USE_IMAGENET_NORMALIZATION = False

transform_list = [
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
]
if USE_IMAGENET_NORMALIZATION:
    transform_list.append(
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    )
transform = transforms.Compose(transform_list)

# =========================
# IMAGE INPUT & YOLO DETECTION
# =========================
if len(sys.argv) < 2:
    print(json.dumps({"error": "No image path provided"}))
    sys.exit(1)

image_path = sys.argv[1]

try:
    original_image = Image.open(image_path).convert("RGB")
except Exception as e:
    print(json.dumps({"error": f"Failed to open image: {str(e)}"}))
    sys.exit(1)

# Run YOLO ROI extraction
roi_image = original_image
plant_detected = False

if yolo_model is not None:
    try:
        # Run YOLO with conf threshold
        yolo_results = yolo_model(image_path, conf=0.5, verbose=False)
        if len(yolo_results) > 0 and len(yolo_results[0].boxes) > 0:
            # Find the box with the highest confidence or largest area
            boxes = yolo_results[0].boxes
            best_box = max(boxes, key=lambda b: float(b.conf[0]))
            
            # Crop the image to this ROI
            x1, y1, x2, y2 = map(int, best_box.xyxy[0].tolist())
            width, height = original_image.size
            
            # Add padding
            padding = 20
            x1 = max(0, x1 - padding)
            y1 = max(0, y1 - padding)
            x2 = min(width, x2 + padding)
            y2 = min(height, y2 + padding)
            
            if x2 > x1 and y2 > y1:
                roi_image = original_image.crop((x1, y1, x2, y2))
                plant_detected = True
    except Exception as e:
        # Fall back to raw image if YOLO errors
        pass

# Non-plant rejection logic
if yolo_model is not None and not plant_detected:
    result = {
        "plant": "None",
        "disease": "No Plant Detected",
        "status": "Rejected",
        "confidence": 0.0
    }
    print(json.dumps(result))
    sys.exit(0)

# Preprocess cropped/raw image
image = transform(roi_image)
image = image.unsqueeze(0).to(device)

# =========================
# INFERENCE & ENSEMBLE
# =========================
with torch.no_grad():
    # General model prediction
    general_output = general_model(image)
    general_probs = torch.nn.functional.softmax(general_output[0], dim=0)
    general_confidence, general_predicted = torch.max(general_probs, 0)
    general_class = class_names[general_predicted.item()]
    general_confidence = general_confidence.item() * 100

    # Specialist model prediction
    specialist_output = specialist_model(image)
    specialist_probs = torch.nn.functional.softmax(specialist_output[0], dim=0)
    specialist_confidence_tensor, specialist_predicted = torch.max(specialist_probs, 0)
    specialist_class = specialist_classes[specialist_predicted.item()]
    specialist_confidence = specialist_confidence_tensor.item() * 100

# Ensemble selection logic
final_class = general_class
final_confidence = general_confidence

if specialist_confidence > 80:
    final_class = specialist_class
    final_confidence = specialist_confidence

# =========================
# CONFIDENCE THRESHOLD & OUTPUT
# =========================
if final_confidence < 70:
    result = {
        "plant": "Unknown",
        "disease": "Unknown",
        "status": "Unknown",
        "confidence": round(final_confidence, 2)
    }
else:
    # Split class name
    parts = final_class.split("___") if "___" in final_class else final_class.split("_")
    plant = parts[0]
    # Reconstruct disease nicely (removing double underscores/extra formatting)
    disease = final_class.replace("___", " - ").replace("__", " ").replace("_", " ")
    
    status = "Healthy"
    if "healthy" not in final_class.lower():
        status = "Diseased"

    result = {
        "plant": plant,
        "disease": disease,
        "status": status,
        "confidence": round(final_confidence, 2)
    }

print(json.dumps(result))
sys.exit(0)