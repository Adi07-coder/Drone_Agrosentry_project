import os
from PIL import Image
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# =========================
# PATH
# =========================

DATASET_PATH = str(PROJECT_ROOT / "augmented_dataset")

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
            print(f"  Skipping non-image: {image_name}")
            continue

        total_checked += 1

        # =========================
        # VERIFY IMAGE INTEGRITY
        # =========================

        try:

            img = Image.open(image_path)
            img.verify()

            # Re-open after verify (verify closes the file)
            img = Image.open(image_path)
            img.load()

        except Exception as e:

            print(f"  Removing corrupted: {image_name} ({e})")
            os.remove(image_path)
            class_removed += 1
            total_removed += 1

    print(f"  Removed {class_removed} corrupted images")

# =========================
# SUMMARY
# =========================

print("\n" + "="*50)
print("CORRUPTED IMAGE REMOVAL COMPLETE")
print("="*50)
print(f"Total Images Checked : {total_checked}")
print(f"Total Images Removed : {total_removed}")
print(f"Total Clean Images   : {total_checked - total_removed}")