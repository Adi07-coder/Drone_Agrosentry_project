import os
import shutil
import torch
import numpy as np

from PIL import Image

from sklearn.cluster import DBSCAN
from torchvision import transforms, models
from torchvision.models import EfficientNet_B0_Weights
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# =========================
# PATHS
# =========================

DATASET_PATH = str(PROJECT_ROOT / "augmented_dataset")

OUTPUT_PATH = str(PROJECT_ROOT / "cleaned_dataset")

OUTLIER_PATH = str(PROJECT_ROOT / "outliers")

os.makedirs(OUTPUT_PATH, exist_ok=True)

os.makedirs(OUTLIER_PATH, exist_ok=True)

# =========================
# DEVICE
# =========================

device = torch.device(
    "cuda" if torch.cuda.is_available()
    else "cpu"
)

print(f"\nUsing Device: {device}")

# =========================
# FEATURE EXTRACTOR
# =========================

model = models.efficientnet_b0(
    weights=EfficientNet_B0_Weights.DEFAULT
)

# Remove the classifier — use feature embeddings only
model.classifier = torch.nn.Identity()

model = model.to(device)

model.eval()

# =========================
# TRANSFORM
# =========================
# ImageNet normalization is REQUIRED for EfficientNetB0 feature extraction
# Without it, embedding vectors are in the wrong activation space,
# causing DBSCAN to cluster incorrectly.

transform = transforms.Compose([

    transforms.Resize((224, 224)),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# =========================
# PROCESS CLASSES
# =========================

total_clean = 0
total_outliers = 0

for class_name in sorted(os.listdir(DATASET_PATH)):

    class_path = os.path.join(DATASET_PATH, class_name)

    if not os.path.isdir(class_path):
        continue

    print(f"\n{'='*50}")
    print(f"Processing: {class_name}")
    print(f"{'='*50}")

    image_paths = []
    features = []

    for image_name in os.listdir(class_path):

        image_path = os.path.join(class_path, image_name)

        try:

            image = Image.open(image_path).convert("RGB")

            image_tensor = transform(image).unsqueeze(0).to(device)

            with torch.no_grad():

                feature = model(image_tensor)

            feature = feature.cpu().numpy().flatten()

            features.append(feature)
            image_paths.append(image_path)

        except Exception as e:

            print(f"  Skipping {image_name}: {e}")
            continue

    if len(features) < 2:
        print(f"  Not enough images to cluster — copying all to clean.")
        clean_class_folder = os.path.join(OUTPUT_PATH, class_name)
        os.makedirs(clean_class_folder, exist_ok=True)
        for img_path in image_paths:
            shutil.copy(img_path, os.path.join(clean_class_folder, os.path.basename(img_path)))
        continue

    # =========================
    # DBSCAN CLUSTERING
    # =========================

    features_array = np.array(features)

    clustering = DBSCAN(
        eps=5,
        min_samples=3
    ).fit(features_array)

    labels = clustering.labels_

    # Stats
    n_outliers = (labels == -1).sum()
    n_clean = (labels != -1).sum()

    print(f"  Total images  : {len(features)}")
    print(f"  Clean images  : {n_clean}")
    print(f"  Outliers      : {n_outliers}")

    # =========================
    # COPY TO OUTPUT FOLDERS
    # =========================

    clean_class_folder = os.path.join(OUTPUT_PATH, class_name)
    outlier_class_folder = os.path.join(OUTLIER_PATH, class_name)

    os.makedirs(clean_class_folder, exist_ok=True)
    os.makedirs(outlier_class_folder, exist_ok=True)

    for img_path, label in zip(image_paths, labels):

        filename = os.path.basename(img_path)

        if label == -1:

            shutil.copy(
                img_path,
                os.path.join(outlier_class_folder, filename)
            )
            total_outliers += 1

        else:

            shutil.copy(
                img_path,
                os.path.join(clean_class_folder, filename)
            )
            total_clean += 1

# =========================
# SUMMARY
# =========================

print("\n" + "="*50)
print("DATASET CLUSTERING COMPLETE")
print("="*50)
print(f"Total Clean Images  : {total_clean}")
print(f"Total Outliers      : {total_outliers}")
print(f"\nCleaned Dataset → {OUTPUT_PATH}")
print(f"Outliers        → {OUTLIER_PATH}")