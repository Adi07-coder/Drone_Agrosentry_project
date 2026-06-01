import os
import sys
import warnings
import torch
import torch.nn as nn
import matplotlib.pyplot as plt

# Suppress warnings
warnings.filterwarnings("ignore")

from PIL import Image
from torchvision import transforms, models
from torchvision.models import EfficientNet_B0_Weights

# =========================
# DEVICE
# =========================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using Device:", device)

# =========================
# DYNAMIC PATHS
# =========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

GENERAL_MODEL_PATH = os.path.join(MODELS_DIR, "best_augmented_full_model.pth")
SPECIALIST_MODEL_PATH = os.path.join(MODELS_DIR, "best_specialist_model.pth")
LABELS_PATH = os.path.join(MODELS_DIR, "labels.txt")
SPECIALIST_LABELS_PATH = os.path.join(MODELS_DIR, "pepper_potato_labels.txt")
TEST_IMAGE_PATH = os.path.join(BASE_DIR, "test_images", "test.jpg")

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

if not os.path.exists(GENERAL_MODEL_PATH):
    print(f"❌ General model path not found at: {GENERAL_MODEL_PATH}")
    sys.exit(1)
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

if not os.path.exists(SPECIALIST_MODEL_PATH):
    print(f"❌ Specialist model path not found at: {SPECIALIST_MODEL_PATH}")
    sys.exit(1)
specialist_model.load_state_dict(torch.load(SPECIALIST_MODEL_PATH, map_location=device))
specialist_model = specialist_model.to(device)
specialist_model.eval()

print("Ensemble Models Loaded Successfully!")

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
# LOAD TEST IMAGE
# =========================
if len(sys.argv) > 1:
    test_path = sys.argv[1]
else:
    test_path = TEST_IMAGE_PATH

print(f"\nLoading image from: {test_path}")
if not os.path.exists(test_path):
    print(f"❌ Test image path not found: {test_path}")
    sys.exit(1)

try:
    original_image = Image.open(test_path).convert("RGB")
except Exception as e:
    print(f"❌ Failed to load image: {e}")
    sys.exit(1)

# Preprocess image
image = transform(original_image).unsqueeze(0).to(device)

# Display image
try:
    plt.imshow(original_image)
    plt.title("Test Image")
    plt.axis("off")
    plt.show(block=False)
    plt.pause(2)
    plt.close()
except Exception:
    pass

# =====================
# GENERAL MODEL INFERENCE
# =====================
with torch.no_grad():
    general_output = general_model(image)
    general_probs = torch.nn.functional.softmax(general_output[0], dim=0)
    general_confidence, general_predicted = torch.max(general_probs, 0)

general_class = class_names[general_predicted.item()]
general_confidence = general_confidence.item() * 100

# =====================
# SPECIALIST MODEL INFERENCE
# =====================
with torch.no_grad():
    specialist_output = specialist_model(image)
    specialist_probs = torch.nn.functional.softmax(specialist_output[0], dim=0)
    specialist_confidence_tensor, specialist_predicted = torch.max(specialist_probs, 0)

specialist_class = specialist_classes[specialist_predicted.item()]
specialist_confidence = specialist_confidence_tensor.item() * 100

# =====================
# ENSEMBLE LOGIC
# =====================
final_class = general_class
final_confidence = general_confidence

if specialist_confidence > 80:
    final_class = specialist_class
    final_confidence = specialist_confidence

# Confidence rejection
if final_confidence < 70:
    final_class = "Unknown Leaf"

# =========================
# RESULTS DISPLAY
# =========================
print("\n========================")
print("PREDICTION RESULT")
print("========================\n")

if final_class == "Unknown Leaf":
    plant_name = "Unknown"
    disease_name = "Low Confidence Prediction"
    health_status = "Unknown"
else:
    # Format labels nicely
    if "___" in final_class:
        parts = final_class.split("___")
    elif "__" in final_class:
        parts = final_class.split("__")
    else:
        parts = final_class.split("_")
        
    plant_name = parts[0]
    disease_name = " ".join(parts[1:]).replace("_", " ").strip()
    
    health_status = "Healthy"
    if "healthy" not in final_class.lower():
        health_status = "Diseased"

print(f"Plant Name        : {plant_name}")
print(f"Predicted Disease : {disease_name}")
print(f"Health Status     : {health_status}")
print(f"Confidence        : {final_confidence:.2f}%")
print("\n========================")