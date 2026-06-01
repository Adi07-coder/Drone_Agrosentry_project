import os
import io
import time
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import torch
import torch.nn as nn
from PIL import Image
import cv2
import numpy as np
from torchvision import transforms, models
from torchvision.models import EfficientNet_B0_Weights
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

# =========================
# DEVICE & GLOBALS
# =========================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
yolo_model = None
general_model = None
specialist_model = None
class_names = []
specialist_classes = []
transform = None

# =========================
# INITIALIZATION
# =========================
def init_models():
    global yolo_model, general_model, specialist_model, class_names, specialist_classes, transform
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODELS_DIR = os.path.join(BASE_DIR, "models")

    GENERAL_MODEL_PATH = os.path.join(MODELS_DIR, "best_augmented_full_model.pth")
    SPECIALIST_MODEL_PATH = os.path.join(MODELS_DIR, "best_specialist_model.pth")
    YOLO_MODEL_PATH = os.path.join(MODELS_DIR, "best.pt")
    LABELS_PATH = os.path.join(MODELS_DIR, "labels.txt")
    SPECIALIST_LABELS_PATH = os.path.join(MODELS_DIR, "pepper_potato_labels.txt")

    # Load Labels
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

    if os.path.exists(SPECIALIST_LABELS_PATH):
        with open(SPECIALIST_LABELS_PATH, "r") as f:
            specialist_classes = [line.strip() for line in f.readlines()]
    else:
        specialist_classes = class_names

    # Load YOLO
    try:
        yolo_model = YOLO(YOLO_MODEL_PATH)
    except Exception as e:
        print("Warning: Failed to load YOLO model", e)
        yolo_model = None

    # Load General Model
    try:
        general_model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
        general_model.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(general_model.classifier[1].in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, len(class_names))
        )
        if os.path.exists(GENERAL_MODEL_PATH):
            general_model.load_state_dict(torch.load(GENERAL_MODEL_PATH, map_location=device))
        general_model = general_model.to(device)
        general_model.eval()
    except Exception as e:
        print("Warning: Failed to load general model", e)

    # Load Specialist Model
    try:
        specialist_model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
        specialist_model.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(specialist_model.classifier[1].in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, len(specialist_classes))
        )
        if os.path.exists(SPECIALIST_MODEL_PATH):
            specialist_model.load_state_dict(torch.load(SPECIALIST_MODEL_PATH, map_location=device))
        specialist_model = specialist_model.to(device)
        specialist_model.eval()
    except Exception as e:
        print("Warning: Failed to load specialist model", e)

    # Transform
    USE_IMAGENET_NORMALIZATION = False
    transform_list = [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ]
    if USE_IMAGENET_NORMALIZATION:
        transform_list.append(
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        )
    transform = transforms.Compose(transform_list)

# Initialize on startup
init_models()

def predict_image(image_path_or_bytes):
    try:
        if isinstance(image_path_or_bytes, str):
            original_image = Image.open(image_path_or_bytes).convert("RGB")
            # YOLO needs file path or PIL image, ultralytics supports PIL images natively
            yolo_input = original_image
        else:
            original_image = Image.open(io.BytesIO(image_path_or_bytes)).convert("RGB")
            yolo_input = original_image
    except Exception as e:
        return {"error": f"Failed to open image: {str(e)}"}

    roi_image = original_image
    plant_detected = False

    if yolo_model is not None:
        try:
            yolo_results = yolo_model(yolo_input, conf=0.5, verbose=False)
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
        except Exception as e:
            pass

    if yolo_model is not None and not plant_detected:
        return {
            "plant": "None",
            "disease": "No Plant Detected",
            "status": "Rejected",
            "confidence": 0.0
        }

    image_tensor = transform(roi_image).unsqueeze(0).to(device)

    with torch.no_grad():
        general_output = general_model(image_tensor)
        general_probs = torch.nn.functional.softmax(general_output[0], dim=0)
        general_confidence_tensor, general_predicted = torch.max(general_probs, 0)
        general_class = class_names[general_predicted.item()]
        general_confidence = general_confidence_tensor.item() * 100

        specialist_output = specialist_model(image_tensor)
        specialist_probs = torch.nn.functional.softmax(specialist_output[0], dim=0)
        specialist_confidence_tensor, specialist_predicted = torch.max(specialist_probs, 0)
        specialist_class = specialist_classes[specialist_predicted.item()]
        specialist_confidence = specialist_confidence_tensor.item() * 100

    final_class = general_class
    final_confidence = general_confidence

    if specialist_confidence > 80:
        final_class = specialist_class
        final_confidence = specialist_confidence

    if final_confidence < 70:
        return {
            "plant": "Unknown",
            "disease": "Unknown",
            "status": "Unknown",
            "confidence": round(final_confidence, 2)
        }
    else:
        parts = final_class.split("___") if "___" in final_class else final_class.split("_")
        plant = parts[0]
        disease = final_class.replace("___", " - ").replace("__", " ").replace("_", " ")
        status = "Healthy" if "healthy" in final_class.lower() else "Diseased"

        return {
            "plant": plant,
            "disease": disease,
            "status": status,
            "confidence": round(final_confidence, 2)
        }

@app.route("/predict", methods=["POST"])
def predict_endpoint():
    """Endpoint for upload detection. Expects an image file."""
    if 'image' not in request.files:
        req_data = request.get_json(silent=True)
        if req_data and 'image_path' in req_data:
            result = predict_image(req_data['image_path'])
            return jsonify(result)
        return jsonify({"error": "No image part in the request"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    image_bytes = file.read()
    result = predict_image(image_bytes)
    return jsonify(result)

def gen_frames():
    """Generator function to stream camera frames with AI overlays"""
    camera = cv2.VideoCapture(0)
    
    # Check if camera opened successfully
    if not camera.isOpened():
        print("Error: Could not open hardware camera.")
        return
        
    last_log_time = 0
        
    while True:
        success, frame = camera.read()
        if not success:
            break
            
        # Convert BGR to RGB for PIL model predictions
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb_frame)
        
        # Run standard inference logic using our existing function
        result = predict_image(pil_img)
        
        plant = result.get("plant", "None")
        disease = result.get("disease", "Unknown")
        conf = result.get("confidence", 0.0)
        
        # Draw overlay on frame
        color = (0, 255, 0) if plant != "None" else (0, 0, 255)
        text = f"{plant} | {disease} | {conf}%"
        cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        # Rate-limit background logging to Node.js backend (e.g. once every 5 seconds)
        current_time = time.time()
        if plant != "None" and (current_time - last_log_time > 5):
            try:
                requests.post("http://localhost:5000/api/detect/realtime/log", json=result, timeout=1)
                last_log_time = current_time
            except Exception as e:
                pass # Fail silently if backend is down
        
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
