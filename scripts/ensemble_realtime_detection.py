import os
import sys
import warnings
import cv2
import torch
import torch.nn as nn
import numpy as np

# Suppress warnings
warnings.filterwarnings("ignore")

from PIL import Image
from ultralytics import YOLO
from torchvision import transforms, models
from torchvision.models import EfficientNet_B0_Weights

# =========================
# DEVICE
# =========================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("\nUsing Device:", device)

# =========================
# PATHS
# =========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

GENERAL_MODEL_PATH = os.path.join(MODELS_DIR, "best_augmented_full_model.pth")
SPECIALIST_MODEL_PATH = os.path.join(MODELS_DIR, "best_specialist_model.pth")
YOLO_MODEL_PATH = os.path.join(MODELS_DIR, "best.pt")
LABELS_PATH = os.path.join(MODELS_DIR, "labels.txt")
SAVE_PATH = os.path.join(BASE_DIR, "ensemble_detections")

os.makedirs(SAVE_PATH, exist_ok=True)

# =========================
# LOAD LABELS
# =========================
if not os.path.exists(LABELS_PATH):
    class_names = [
        "Pepper__bell___Bacterial_spot", "Pepper__bell___healthy",
        "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy"
    ]
else:
    with open(LABELS_PATH, "r") as f:
        class_names = [line.strip() for line in f.readlines()]

specialist_classes = [
    'Pepper__bell___Bacterial_spot',
    'Pepper__bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy'
]

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
# LOAD MODELS
# =========================
print("\nLoading Models...")

# YOLOv8 Plant Detector (Primary ROI extractor)
try:
    yolo_model = YOLO(YOLO_MODEL_PATH)
    print("  - YOLOv8 Detector Loaded Successfully!")
except Exception as e:
    yolo_model = None
    print(f"  - ⚠️  YOLOv8 loading failed: {e}. Falling back to center-crop.")

# General Model
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
print("  - General Classifier Model Loaded!")

# Specialist Model
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
print("  - Specialist Classifier Model Loaded!")

# =========================
# OPEN CAMERA
# =========================
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Error Opening Camera")
    sys.exit(1)

print("\nStarting Ensemble Real-Time Detection...\n")

capture_count = 0
prediction_buffer = []
BUFFER_SIZE = 10

# =========================
# REALTIME LOOP
# =========================
while True:
    ret, frame = cap.read()
    if not ret:
        break

    height, width, _ = frame.shape
    roi_coords = None
    plant_detected = False

    # 1. Primary: Run YOLO detection to find plant ROI coordinates
    if yolo_model is not None:
        try:
            yolo_results = yolo_model(frame, conf=0.5, verbose=False)
            if len(yolo_results) > 0 and len(yolo_results[0].boxes) > 0:
                # Get the highest-confidence bounding box
                boxes = yolo_results[0].boxes
                best_box = max(boxes, key=lambda b: float(b.conf[0]))
                x1, y1, x2, y2 = map(int, best_box.xyxy[0].tolist())
                
                # Padding
                padding = 20
                x1 = max(0, x1 - padding)
                y1 = max(0, y1 - padding)
                x2 = min(width, x2 + padding)
                y2 = min(height, y2 + padding)
                
                if x2 > x1 and y2 > y1:
                    roi_coords = (x1, y1, x2, y2)
                    plant_detected = True
        except Exception as e:
            pass

    # 2. Fallback: If YOLO failed/disabled or no plant detected, use center-crop ROI
    if not plant_detected:
        x1 = int(width * 0.2)
        y1 = int(height * 0.2)
        x2 = int(width * 0.8)
        y2 = int(height * 0.8)
        roi_coords = (x1, y1, x2, y2)

    x1, y1, x2, y2 = roi_coords
    roi = frame[y1:y2, x1:x2]

    # Preprocess crop
    if roi.size > 0:
        image = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(image)
        image = transform(image).unsqueeze(0).to(device)

        # =====================
        # GENERAL MODEL
        # =====================
        with torch.no_grad():
            general_output = general_model(image)
            general_probs = torch.nn.functional.softmax(general_output[0], dim=0)
            general_confidence, general_predicted = torch.max(general_probs, 0)
            general_class = class_names[general_predicted.item()]
            general_confidence = general_confidence.item() * 100

        # =====================
        # SPECIALIST MODEL
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

        if final_confidence < 70:
            final_class = "Unknown Leaf"

        # Buffer stability
        prediction_buffer.append(final_class)
        if len(prediction_buffer) > BUFFER_SIZE:
            prediction_buffer.pop(0)

        # Stable prediction
        final_class = max(set(prediction_buffer), key=prediction_buffer.count)

        # =====================
        # FORMAT PLANT & DISEASE
        # =====================
        if final_class == "Unknown Leaf":
            plant_name = "Unknown"
            disease_name = "Low Confidence Prediction"
            health_status = "Unknown Leaf"
        else:
            # Fix split logic to handle multi-word diseases correctly
            if "___" in final_class:
                parts = final_class.split("___")
            elif "__" in final_class:
                parts = final_class.split("__")
            else:
                parts = final_class.split("_")
                
            plant_name = parts[0]
            # Replace underscores and join remaining words cleanly
            disease_name = " ".join(parts[1:]).replace("_", " ").strip()
            
            if "healthy" in final_class.lower():
                health_status = "Healthy Leaf"
            else:
                health_status = "Diseased Leaf"

        # =====================
        # DRAW BBOX ON SCREEN
        # =====================
        # Red if diseased, Green if healthy, Yellow if unknown
        if final_class == "Unknown Leaf":
            box_color = (0, 255, 255)
        elif "healthy" in final_class.lower():
            box_color = (0, 255, 0)
        else:
            box_color = (0, 0, 255)

        # Draw ROI box
        cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2 if plant_detected else 1)
        
        # Label to indicate if ROI is YOLO detected or Center Crop
        label_text = "ROI: Plant Detector" if plant_detected else "ROI: Center Crop"
        cv2.putText(frame, label_text, (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.4, box_color, 1)

        # =====================
        # INFO PANEL
        # =====================
        # Black semi-transparent panel for results overlay
        cv2.rectangle(frame, (20, 20), (600, 210), (0, 0, 0), -1)

        cv2.putText(
            frame,
            f"Plant: {plant_name}",
            (40, 60),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"Status: {health_status}",
            (40, 100),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"Disease: {disease_name}",
            (40, 140),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 0, 255) if health_status == "Diseased Leaf" else (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"Confidence: {final_confidence:.2f}%",
            (40, 180),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 255),
            2
        )

    # Show frame
    cv2.imshow("AgroSentry Ensemble Detection", frame)

    key = cv2.waitKey(1)
    
    # Save detection on manual press 's'
    if key == ord('s'):
        capture_count += 1
        save_file = os.path.join(SAVE_PATH, f"ensemble_detection_{capture_count}.jpg")
        cv2.imwrite(save_file, frame)
        print(f"\n✅ Detection frame manually saved: {save_file}")

    # Exit on 'q'
    if key == ord('q'):
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()
print("\nEnsemble Detection Stopped Successfully!")