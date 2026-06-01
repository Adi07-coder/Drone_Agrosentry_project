import cv2
import torch
import torch.nn as nn
import numpy as np

from ultralytics import YOLO

from torchvision import transforms, models
from torchvision.models import EfficientNet_B0_Weights

from PIL import Image
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# ====================================
# DEVICE
# ====================================

device = torch.device(

    "cuda"

    if torch.cuda.is_available()

    else "cpu"
)

print(f"\nUsing Device: {device}")

# ====================================
# PATHS
# ====================================

YOLO_MODEL_PATH = str(PROJECT_ROOT / "models" / "best.pt")

CLASSIFIER_MODEL_PATH = str(PROJECT_ROOT / "models" / "best_augmented_full_model.pth")

LABELS_PATH = str(PROJECT_ROOT / "models" / "labels.txt")

# ====================================
# LOAD LABELS
# ====================================

with open(LABELS_PATH, "r") as f:

    class_names = [

        line.strip()

        for line in f.readlines()
    ]

# ====================================
# LOAD YOLO MODEL
# ====================================

print("\nLoading YOLOv8 Model...")

yolo_model = YOLO(YOLO_MODEL_PATH)

print("YOLO Loaded Successfully!")

# ====================================
# LOAD EFFICIENTNET MODEL
# ====================================

print("\nLoading EfficientNet Model...")

classifier_model = models.efficientnet_b0(

    weights=EfficientNet_B0_Weights.DEFAULT
)

classifier_model.classifier = nn.Sequential(

    nn.Dropout(0.5),

    nn.Linear(

        classifier_model.classifier[1].in_features,

        512
    ),

    nn.ReLU(),

    nn.Dropout(0.3),

    nn.Linear(

        512,

        len(class_names)
    )
)

classifier_model.load_state_dict(

    torch.load(

        CLASSIFIER_MODEL_PATH,

        map_location=device
    )
)

classifier_model = classifier_model.to(device)

classifier_model.eval()

print("EfficientNet Loaded Successfully!")

# ====================================
# IMAGE TRANSFORM
# ====================================

transform = transforms.Compose([

    transforms.Resize((224, 224)),

    transforms.ToTensor(),
])

# ====================================
# START WEBCAM
# ====================================

cap = cv2.VideoCapture(0)

if not cap.isOpened():

    print("Cannot Open Webcam!")

    exit()

print("\nPress 'Q' to Quit")

# ====================================
# REALTIME LOOP
# ====================================

while True:

    ret, frame = cap.read()

    if not ret:

        break

    # =================================
    # YOLO DETECTION
    # =================================

    results = yolo_model(

        frame,

        conf=0.5
    )

    detected = False

    # =================================
    # PROCESS DETECTIONS
    # =================================

    for result in results:

        boxes = result.boxes

        for box in boxes:

            detected = True

            # =========================
            # GET BOUNDING BOX
            # =========================

            x1, y1, x2, y2 = map(

                int,

                box.xyxy[0]
            )

            # =========================
            # CROP ROI
            # =========================

            roi = frame[

                y1:y2,

                x1:x2
            ]

            if roi.size == 0:
                continue

            # =========================
            # CONVERT TO PIL
            # =========================

            roi_rgb = cv2.cvtColor(

                roi,

                cv2.COLOR_BGR2RGB
            )

            pil_image = Image.fromarray(
                roi_rgb
            )

            # =========================
            # TRANSFORM
            # =========================

            input_tensor = transform(
                pil_image
            )

            input_tensor = input_tensor.unsqueeze(0)

            input_tensor = input_tensor.to(device)

            # =========================
            # PREDICTION
            # =========================

            with torch.no_grad():

                output = classifier_model(
                    input_tensor
                )

                probabilities = torch.nn.functional.softmax(

                    output[0],

                    dim=0
                )

                confidence, predicted = torch.max(

                    probabilities,

                    0
                )

            confidence = confidence.item() * 100

            predicted_class = class_names[
                predicted.item()
            ]

            # =========================
            # SPLIT LABELS
            # =========================

            plant_name = predicted_class.split("_")[0]

            disease_name = predicted_class

            # =========================
            # HEALTH STATUS
            # =========================

            status = "Healthy"

            if "healthy" not in disease_name.lower():

                status = "Diseased"

            # =========================
            # DRAW BOX
            # =========================

            color = (0, 255, 0)

            if status == "Diseased":

                color = (0, 0, 255)

            cv2.rectangle(

                frame,

                (x1, y1),

                (x2, y2),

                color,

                2
            )

            # =========================
            # DISPLAY TEXT
            # =========================

            text = (

                f"{plant_name} | "

                f"{status} | "

                f"{confidence:.2f}%"
            )

            cv2.putText(

                frame,

                text,

                (x1, y1 - 10),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.6,

                color,

                2
            )

            # =========================
            # DISEASE TEXT
            # =========================

            cv2.putText(

                frame,

                disease_name,

                (x1, y2 + 25),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.6,

                color,

                2
            )

    # =================================
    # NO PLANT DETECTED
    # =================================

    if not detected:

        cv2.putText(

            frame,

            "No Plant Detected",

            (30, 40),

            cv2.FONT_HERSHEY_SIMPLEX,

            1,

            (0, 0, 255),

            3
        )

    # =================================
    # SHOW FRAME
    # =================================

    cv2.imshow(

        "AgroSentry Hybrid Detection",

        frame
    )

    # =================================
    # EXIT
    # =================================

    if cv2.waitKey(1) & 0xFF == ord('q'):

        break

# ====================================
# CLEANUP
# ====================================

cap.release()

cv2.destroyAllWindows()

print("\nRealtime Detection Closed!")

# python scripts/hybrid_realtime_detection.py