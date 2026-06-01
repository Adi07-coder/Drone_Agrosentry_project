import os
import imagehash
from PIL import Image
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# =========================
# PATH
# =========================

DATASET_PATH = str(PROJECT_ROOT / "augmented_dataset")

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}

# =========================
# PER-CLASS DEDUPLICATION
# =========================
# Hashes are scoped per class folder.
# A tomato_healthy and pepper_healthy image with the
# same hash are NOT duplicates — they belong to different classes.

total_removed = 0
total_checked = 0

for class_name in sorted(os.listdir(DATASET_PATH)):

    class_path = os.path.join(DATASET_PATH, class_name)

    if not os.path.isdir(class_path):
        continue

    print(f"\nChecking: {class_name}")

    # Hash map scoped to this class only
    class_hashes = {}
    class_removed = 0

    for image_name in os.listdir(class_path):

        image_path = os.path.join(class_path, image_name)

        ext = os.path.splitext(image_name)[1].lower()

        if ext not in VALID_EXTENSIONS:
            continue

        total_checked += 1

        try:

            image = Image.open(image_path).convert("RGB")

            # Use perceptual hash for near-duplicate detection
            image_hash = imagehash.phash(image)

            if image_hash in class_hashes:

                print(f"  Removing duplicate: {image_name}")
                print(f"    (matches: {os.path.basename(class_hashes[image_hash])})")

                os.remove(image_path)

                class_removed += 1
                total_removed += 1

            else:

                class_hashes[image_hash] = image_path

        except Exception as e:

            print(f"  Error processing {image_name}: {e}")

    print(f"  Removed {class_removed} duplicates from {class_name}")

# =========================
# SUMMARY
# =========================

print("\n" + "="*50)
print("DUPLICATE REMOVAL COMPLETE")
print("="*50)
print(f"Total Images Checked : {total_checked}")
print(f"Total Duplicates Removed : {total_removed}")
print(f"Unique Images Remaining  : {total_checked - total_removed}")