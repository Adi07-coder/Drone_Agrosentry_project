from ultralytics import YOLO
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

try:
    model = YOLO(str(PROJECT_ROOT / "yolo26n.pt"))
    print(model.names)
except Exception as e:
    print(e)
