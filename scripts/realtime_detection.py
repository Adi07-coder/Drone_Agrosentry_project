import os
import sys
import warnings
import cv2
import json
import argparse
import random
from datetime import datetime
from ultralytics import YOLO

# Suppress warnings
warnings.filterwarnings("ignore")
os.environ['YOLO_VERBOSE'] = 'False'

# =========================
# ENVIRONMENT & API SETUP
# =========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVE_FOLDER = os.path.join(BASE_DIR, "realtime_detections")
os.makedirs(SAVE_FOLDER, exist_ok=True)

MODEL_PATH = os.path.join(BASE_DIR, "yolov8s.pt")
try:
    model = YOLO(MODEL_PATH)
except Exception as e:
    print(json.dumps({"error": f"Failed to load YOLO model: {e}"}))
    sys.exit(1)

# COCO classes that we can treat as plants or crops for the simulation
PLANT_CLASSES = [58, 47, 49, 50, 51] # potted plant, apple, orange, broccoli, carrot

# Mock diseases based on the plant class for a realistic demo
DISEASE_MOCK_DATA = [
    {
        "status": "Healthy",
        "diseaseName": "None",
        "symptoms": ["Vibrant color", "Firm texture"],
        "treatment": "Maintain current watering and sunlight regimen.",
        "fertilizer": "Standard NPK 10-10-10 every 4 weeks.",
        "prevention": "Ensure good air circulation and avoid overwatering."
    },
    {
        "status": "Diseased",
        "diseaseName": "Leaf Blight",
        "symptoms": ["Brown spots", "Yellowing edges", "Wilting"],
        "treatment": "Remove affected leaves. Apply copper-based fungicide.",
        "fertilizer": "Use potassium-rich fertilizer to strengthen cell walls.",
        "prevention": "Water at the base of the plant to keep leaves dry."
    },
    {
        "status": "Diseased",
        "diseaseName": "Powdery Mildew",
        "symptoms": ["White powdery spots", "Leaf curling"],
        "treatment": "Spray with neem oil or sulfur fungicide.",
        "fertilizer": "Avoid excess nitrogen which promotes susceptible new growth.",
        "prevention": "Increase spacing between plants for better airflow."
    }
]

def process_frame(frame, is_cli=False):
    # Run YOLO inference
    results = model(frame, verbose=False)
    
    best_box = None
    best_conf = 0
    best_class = None
    best_class_name = None

    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls_id = int(box.cls[0].item())
            conf = box.conf[0].item()
            # If it's one of our plant-related classes or just pick the highest confidence
            # But let's prioritize plant classes if found, else fallback to the highest conf object
            if cls_id in PLANT_CLASSES or best_box is None:
                if conf > best_conf:
                    best_conf = conf
                    best_box = box.xyxy[0].tolist() # [x1, y1, x2, y2]
                    best_class = cls_id
                    best_class_name = model.names[cls_id]

    if best_box is not None and best_conf > 0.3:
        x1, y1, x2, y2 = map(int, best_box)
        w = x2 - x1
        h = y2 - y1
        
        # Simulate disease logic deterministically based on bounding box size to avoid flickering
        sim_index = (w * h) % len(DISEASE_MOCK_DATA)
        mock_disease = DISEASE_MOCK_DATA[sim_index]
        
        output_data = {
            "plantName": best_class_name.capitalize(),
            "diseaseName": mock_disease["diseaseName"],
            "status": mock_disease["status"],
            "confidence": int(best_conf * 100),
            "symptoms": mock_disease["symptoms"],
            "treatment": mock_disease["treatment"],
            "fertilizer": mock_disease["fertilizer"],
            "prevention": mock_disease["prevention"],
            "bbox": [x1, y1, w, h]
        }
        
        if is_cli:
            print(json.dumps(output_data))
        return True, output_data
    else:
        if is_cli:
            print(json.dumps({
                "plantName": "None",
                "diseaseName": "None",
                "status": "Unknown",
                "confidence": 0,
                "bbox": None
            }))
        return False, None

def main():
    parser = argparse.ArgumentParser(description="AgroSentry Local Detection")
    parser.add_argument("--image", type=str, help="Path to image for CLI processing")
    args = parser.parse_args()

    if args.image:
        if not os.path.exists(args.image):
            print(json.dumps({"error": "Image not found"}))
            sys.exit(1)
        frame = cv2.imread(args.image)
        if frame is None:
            print(json.dumps({"error": "Failed to read image"}))
            sys.exit(1)
        process_frame(frame, is_cli=True)
        sys.exit(0)

    # Standalone Live Camera Loop (Testing Mode)
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    import time
    time.sleep(2)

    if not cap.isOpened():
        print("❌ Error Opening Camera")
        sys.exit(1)

    print("\nStarting AgroSentry Real-Time Detection...")
    print("Press 'S' to manually save the current frame.")
    print("Press 'Q' to quit.\n")

    capture_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        output_frame = frame.copy()
        found, data = process_frame(frame, is_cli=False)
        
        if found and data and data["bbox"]:
            x, y, w, h = data["bbox"]
            color = (0, 255, 0) if data["status"] == "Healthy" else (0, 0, 255)
            cv2.rectangle(output_frame, (x, y), (x+w, y+h), color, 2)
            cv2.rectangle(output_frame, (x, y-25), (x+150, y), (0, 0, 0), -1)
            cv2.putText(output_frame, f'{data["plantName"]} - {data["status"]}', (x+5, y-8), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

        cv2.imshow("AgroSentry Real-Time Detection", output_frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('s') or key == ord('S'):
            capture_count += 1
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            save_path = os.path.join(SAVE_FOLDER, f"manual_detection_{timestamp}_{capture_count}.jpg")
            cv2.imwrite(save_path, output_frame)
            print(f"✅ Saved: {save_path}")
        elif key == ord('q') or key == ord('Q'):
            print("Closing AgroSentry...")
            break

    cap.release()
    cv2.destroyAllWindows()
    print("\nReal-time Detection Stopped!")

if __name__ == "__main__":
    main()
