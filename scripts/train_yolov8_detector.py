import torch
from ultralytics import YOLO
from pathlib import Path
import shutil
import os

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# =========================
# DEVICE DETECTION
# =========================

if torch.cuda.is_available():
    device = 0
    print(f"\n✅ GPU detected: {torch.cuda.get_device_name(0)}")
    print("Training on GPU")
else:
    device = "cpu"
    print("\n⚠️  No GPU detected. Training on CPU (will be slow).")

# =========================
# PATHS
# =========================

DATA_YAML = str(PROJECT_ROOT / "yolo_dataset" / "data.yaml")

# =========================
# LOAD YOLOv8s MODEL
# =========================

print("\nLoading YOLOv8s pretrained model...")

model = YOLO("yolov8s.pt")

print("YOLOv8s loaded successfully!")

# =========================
# TRAIN
# =========================

print("\nStarting YOLOv8 Plant Detection Training...")
print(f"Config: epochs=50, imgsz=640, batch=16")
print(f"Data: {DATA_YAML}\n")

results = model.train(

    data=DATA_YAML,

    epochs=50,

    imgsz=640,

    batch=16,

    device=device,

    # Early stopping
    patience=10,

    # Save best and last
    save=True,

    # Generate training plots
    plots=True,

    # Project name for output folder
    project=str(PROJECT_ROOT / "runs"),

    name="plant_detector",

    # Pretrained weights
    pretrained=True,

    # Verbose output
    verbose=True
)

# =========================
# TRAINING COMPLETE
# =========================

print("\n" + "="*50)
print("YOLO TRAINING COMPLETE")
print("="*50)
print(f"\nBest model saved to:")
print(f"  runs/plant_detector/weights/best.pt")
print(f"\nCopy best.pt to:")
print(f"  {PROJECT_ROOT / 'models' / 'best.pt'}")

# Copy best model to models folder automatically
import shutil
import os

best_pt_src = str(PROJECT_ROOT / "runs" / "plant_detector" / "weights" / "best.pt")
best_pt_dst = str(PROJECT_ROOT / "models" / "best.pt")

if os.path.exists(best_pt_src):
    shutil.copy(best_pt_src, best_pt_dst)
    print(f"\n✅ Auto-copied best.pt to models/ folder!")
else:
    print(f"\n⚠️  best.pt not found at expected path. Please copy manually.")

# python scripts/train_yolov8_detector.py
