import os
import cv2
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# =========================
# PATH & CONFIG
# =========================

DATASET_PATH = str(PROJECT_ROOT / "augmented_dataset")

# Laplacian variance threshold — below this = blurry
# Industry standard: 60-100 for plant images
THRESHOLD = 60

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}

# =========================
# PROCESS DATASET
# =========================

total_removed = 0
total_checked = 0

for class_name in sorted(os.listdir(DATASET_PATH)):

    class_path = os.path.join(DATASET_PATH, class_name)

    if not os.path.isdir(class_path):
        continue

    print(f"\nChecking: {class_name}")

    class_removed = 0

    for image_name in os.listdir(class_path):

        image_path = os.path.join(class_path, image_name)

        # =========================
        # SKIP NON-IMAGE FILES
        # =========================

        ext = os.path.splitext(image_name)[1].lower()

        if ext not in VALID_EXTENSIONS:
            continue

        total_checked += 1

        # =========================
        # BLUR DETECTION
        # =========================

        try:

            image = cv2.imread(image_path)

            if image is None:
                print(f"  Cannot read: {image_name}")
                continue

            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()

            if blur_score < THRESHOLD:

                print(f"  Removing blurry: {image_name} (score={blur_score:.1f})")

                os.remove(image_path)

                class_removed += 1
                total_removed += 1

        except Exception as e:

            print(f"  Error processing {image_name}: {e}")

    print(f"  Removed {class_removed} blurry images")

# =========================
# SUMMARY
# =========================

print("\n" + "="*50)
print("BLURRY IMAGE REMOVAL COMPLETE")
print("="*50)
print(f"Blur Threshold       : {THRESHOLD}")
print(f"Total Images Checked : {total_checked}")
print(f"Total Images Removed : {total_removed}")
print(f"Total Sharp Images   : {total_checked - total_removed}")