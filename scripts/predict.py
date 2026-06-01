import sys
import os
import warnings

import warnings
import sys
import os

# Redirect all stdout to stderr to prevent PythonShell JSON parsing errors from YOLO/Torch
class StdoutRedirector:
    def __init__(self, stream):
        self.stream = stream
    def write(self, data):
        self.stream.write(data)
    def flush(self):
        self.stream.flush()

old_stdout = sys.stdout
sys.stdout = StdoutRedirector(sys.stderr)

# Suppress warnings
warnings.filterwarnings("ignore")

import torch
import torch.nn as nn
from PIL import Image, ImageOps
from torchvision import transforms, models
from torchvision.models import EfficientNet_B0_Weights
from ultralytics import YOLO
import json

# =========================
# DEVICE
# =========================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =========================
# PATHS
# =========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

GENERAL_MODEL_PATH = os.path.join(MODELS_DIR, "best_augmented_full_model.pth")
SPECIALIST_MODEL_PATH = os.path.join(MODELS_DIR, "best_specialist_model.pth")
YOLO_MODEL_PATH = os.path.join(MODELS_DIR, "best.pt")
LABELS_PATH = os.path.join(MODELS_DIR, "labels.txt")
SPECIALIST_LABELS_PATH = os.path.join(MODELS_DIR, "pepper_potato_labels.txt")

# Default test image if not provided as argument
DEFAULT_TEST_IMAGE = os.path.join(BASE_DIR, "test_images", "test.jpg")

# =========================
# GET IMAGE PATH
# =========================
if len(sys.argv) > 1:
    image_path = sys.argv[1]
    # Check for --image arg (since we run with args: ['--image', imagePath])
    if sys.argv[1] == '--image' and len(sys.argv) > 2:
        image_path = sys.argv[2]
else:
    image_path = DEFAULT_TEST_IMAGE

if not os.path.exists(image_path):
    sys.stdout = old_stdout
    print(json.dumps({"plantName": "None", "error": f"Image path not found: {image_path}"}))
    sys.exit(1)

# =========================
# LOAD LABELS
# =========================
if not os.path.exists(LABELS_PATH):
    print(f"Labels file not found at {LABELS_PATH}. Using fallback classes.", file=sys.stderr)
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

if os.path.exists(SPECIALIST_LABELS_PATH):
    with open(SPECIALIST_LABELS_PATH, "r") as f:
        specialist_classes = [line.strip() for line in f.readlines()]
else:
    specialist_classes = class_names

print("Loading Models...", file=sys.stderr)

try:
    print(f"Loading YOLOv8 Detector from: {os.path.basename(YOLO_MODEL_PATH)}", file=sys.stderr)
    yolo_model = YOLO(YOLO_MODEL_PATH)
    yolo_model.verbose = False
except Exception as e:
    print(f"YOLO model loading failed: {e}. Proceeding without YOLO ROI step.", file=sys.stderr)
    yolo_model = None

try:
    print(f"Loading General Classifier from: {os.path.basename(GENERAL_MODEL_PATH)}", file=sys.stderr)
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
except Exception as e:
    sys.stdout = old_stdout
    print(json.dumps({"plantName": "None", "error": f"Error loading General Classifier: {e}"}))
    sys.exit(1)

try:
    print(f"Loading Specialist Classifier from: {os.path.basename(SPECIALIST_MODEL_PATH)}", file=sys.stderr)
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
except Exception as e:
    sys.stdout = old_stdout
    print(json.dumps({"plantName": "None", "error": f"Error loading Specialist Classifier: {e}"}))
    sys.exit(1)

print("All Models Loaded Successfully!", file=sys.stderr)

# =========================
# IMAGE TRANSFORM
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
# IMAGE PROCESSING & YOLO DETECT
# =========================
try:
    original_image = Image.open(image_path).convert("RGB")
except Exception as e:
    sys.stdout = old_stdout
    print(json.dumps({"plantName": "None", "error": f"Failed to load image: {e}"}))
    sys.exit(1)

roi_image = original_image
plant_detected = False
detected_bbox = None

if yolo_model is not None:
    try:
        yolo_results = yolo_model(image_path, conf=0.5, verbose=False)
        if len(yolo_results) > 0 and len(yolo_results[0].boxes) > 0:
            boxes = yolo_results[0].boxes
            best_box = max(boxes, key=lambda b: float(b.conf[0]))
            
            x1, y1, x2, y2 = map(int, best_box.xyxy[0].tolist())
            width, height = original_image.size
            
            padding = 20
            x1 = max(0, x1 - padding)
            y1 = max(0, y1 - padding)
            x2 = min(width, x2 + padding)
            y2 = min(height, y2 + padding)
            
            if x2 > x1 and y2 > y1:
                roi_image = original_image.crop((x1, y1, x2, y2))
                plant_detected = True
                detected_bbox = [x1, y1, x2 - x1, y2 - y1]
                print("Plant ROI successfully detected and cropped.", file=sys.stderr)
    except Exception as e:
        print(f"YOLO inference exception: {e}. Falling back to full image.", file=sys.stderr)

# Pad the ROI to a perfect square before resizing to prevent geometric distortion
max_dim = max(roi_image.size)
padded_roi = ImageOps.pad(roi_image, (max_dim, max_dim), color=(0, 0, 0))

# Preprocess for classification
image_tensor = transform(padded_roi).unsqueeze(0).to(device)

# =========================
# INFERENCE & ENSEMBLE
# =========================
with torch.no_grad():
    # General model prediction
    general_output = general_model(image_tensor)
    general_probs = torch.nn.functional.softmax(general_output[0], dim=0)
    general_confidence, general_predicted = torch.max(general_probs, 0)
    general_class = class_names[general_predicted.item()]
    general_confidence = general_confidence.item() * 100

    # Specialist model prediction
    specialist_output = specialist_model(image_tensor)
    specialist_probs = torch.nn.functional.softmax(specialist_output[0], dim=0)
    specialist_confidence_tensor, specialist_predicted = torch.max(specialist_probs, 0)
    specialist_class = specialist_classes[specialist_predicted.item()]
    specialist_confidence = specialist_confidence_tensor.item() * 100

# Ensemble selection
final_class = general_class
final_confidence = general_confidence

if specialist_confidence > 80:
    final_class = specialist_class
    final_confidence = specialist_confidence

disease_knowledge = {
    "Bacterial_spot": {
        "symptoms": ["Dark, water-soaked spots on leaves", "Spots turn brown or black with yellow halos", "Premature leaf drop"],
        "treatment": "Apply copper-based bactericides early. Remove and destroy infected plant debris.",
        "fertilizer": "Avoid excess nitrogen. Ensure balanced potassium and calcium.",
        "prevention": "Use disease-free seeds. Practice crop rotation. Avoid overhead watering."
    },
    "Early_blight": {
        "symptoms": ["Brown spots with concentric rings (target-like) on lower leaves", "Yellowing around spots", "Defoliation"],
        "treatment": "Apply fungicides containing chlorothalonil or copper. Remove infected lower leaves.",
        "fertilizer": "Maintain adequate nitrogen levels to keep plants vigorous.",
        "prevention": "Ensure good air circulation. Water at the base of the plant. Rotate crops."
    },
    "Late_blight": {
        "symptoms": ["Large, dark, water-soaked lesions on leaves and stems", "White fungal growth on undersides of leaves in wet conditions", "Rapid wilting and death"],
        "treatment": "Apply specific fungicides like metalaxyl or mancozeb immediately. Destroy severely infected plants.",
        "fertilizer": "Ensure balanced nutrition, but avoid excessive nitrogen which favors rapid, susceptible growth.",
        "prevention": "Plant resistant varieties. Eliminate cull piles and volunteer potatoes. Ensure good drainage."
    },
    "Leaf_Mold": {
        "symptoms": ["Pale green or yellow spots on upper leaf surfaces", "Olive-green to brown mold on undersides", "Leaves wither and die"],
        "treatment": "Improve ventilation. Apply fungicides such as chlorothalonil or copper if severe.",
        "fertilizer": "Avoid excessive nitrogen to prevent overly dense canopies.",
        "prevention": "Maintain lower humidity in greenhouses. Increase plant spacing. Water at the base."
    },
    "Septoria_leaf_spot": {
        "symptoms": ["Numerous small, circular spots with dark borders and tan centers on lower leaves", "Tiny black fruiting bodies (pycnidia) in the center of spots", "Defoliation starting from the bottom"],
        "treatment": "Apply fungicides containing chlorothalonil or copper. Remove infected leaves.",
        "fertilizer": "Ensure balanced nutrition to support new growth to replace lost leaves.",
        "prevention": "Remove plant debris at the end of the season. Practice crop rotation. Weed control."
    },
    "Spider_mites": {
        "symptoms": ["Stippling or tiny yellow/white dots on leaves", "Fine webbing on undersides of leaves or between stems", "Leaves turn bronze or yellow and drop"],
        "treatment": "Use insecticidal soap, horticultural oil, or specific miticides. Introduce predatory mites.",
        "fertilizer": "Avoid excess nitrogen, which can increase mite populations. Maintain adequate potassium.",
        "prevention": "Keep plants well-watered (mites prefer dry, dusty conditions). Regularly hose off foliage."
    },
    "Target_Spot": {
        "symptoms": ["Dark brown spots with concentric rings on leaves, stems, and fruit", "Spots may coalesce to blight entire leaves"],
        "treatment": "Apply fungicides like chlorothalonil. Remove infected plant parts.",
        "fertilizer": "Maintain balanced fertility to keep plants vigorous.",
        "prevention": "Improve airflow. Avoid overhead irrigation. Practice crop rotation."
    },
    "YellowLeaf__Curl_Virus": {
        "symptoms": ["Upward curling of leaf margins", "Yellowing (chlorosis) of leaf margins and between veins", "Stunted plant growth", "Reduced fruit set"],
        "treatment": "No cure for the virus. Manage the vector (whiteflies) with insecticidal soaps or oils. Remove infected plants.",
        "fertilizer": "Maintain optimal nutrition, but fertilizer will not cure the virus.",
        "prevention": "Use virus-resistant varieties. Control whitefly populations. Use reflective mulches."
    },
    "mosaic_virus": {
        "symptoms": ["Mottled light and dark green patterns on leaves", "Stunted growth", "Distorted, fern-like leaves"],
        "treatment": "No cure. Remove and destroy infected plants immediately to prevent spread.",
        "fertilizer": "Maintain overall plant health, but it will not cure the virus.",
        "prevention": "Use virus-free seeds. Disinfect tools. Control aphids and other sap-sucking insects. Do not smoke near plants (tobacco mosaic virus)."
    },
    "healthy": {
        "symptoms": ["Vibrant green color", "Firm texture", "No visible spots or lesions", "Normal growth rate"],
        "treatment": "None needed. Continue current care.",
        "fertilizer": "Maintain a balanced, regular fertilizer schedule suitable for the crop and growth stage.",
        "prevention": "Continue good cultural practices: proper watering, adequate spacing, and regular scouting."
    }
}

# Dynamic threshold: If YOLO explicitly found a plant, use 70%. If YOLO missed it (e.g. close up leaf or a face), require 95% confidence to strictly prevent false positives on random objects like hands or walls.
threshold = 70 if plant_detected else 95

if final_confidence < threshold:
    result = {
        "plantName": "Unknown",
        "diseaseName": "Unknown",
        "status": "Unknown",
        "confidence": int(final_confidence),
        "bbox": detected_bbox
    }
else:
    parts = final_class.split("___") if "___" in final_class else final_class.split("_")
    plant = parts[0]
    disease_raw = final_class.replace("___", " - ").replace("__", " ").replace("_", " ")
    
    status = "Healthy"
    if "healthy" not in final_class.lower():
        status = "Diseased"
        
    disease_key = next((k for k in disease_knowledge.keys() if k.lower() in final_class.lower()), "healthy" if status == "Healthy" else None)
    
    knowledge = disease_knowledge.get(disease_key, {}) if disease_key else {
        "symptoms": ["Symptoms typical of " + disease_raw],
        "treatment": "Consult local agricultural extension for specific treatments.",
        "fertilizer": "Maintain balanced NPK.",
        "prevention": "Ensure good hygiene and proper watering."
    }
    
    result = {
        "plantName": plant,
        "diseaseName": "None" if status == "Healthy" else disease_raw,
        "status": status,
        "confidence": int(final_confidence),
        "bbox": detected_bbox,
        "symptoms": knowledge.get("symptoms", []),
        "treatment": knowledge.get("treatment", "Consult local agricultural extension."),
        "fertilizer": knowledge.get("fertilizer", "Maintain balanced NPK."),
        "prevention": knowledge.get("prevention", "Ensure good hygiene and proper watering.")
    }

# Restore stdout just for the final JSON output
sys.stdout = old_stdout
print(json.dumps(result))
sys.exit(0)