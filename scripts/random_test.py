import os
import random
import shutil
import warnings
import pandas as pd

import torch
import torch.nn as nn

from PIL import Image
from datetime import datetime
from torchvision import transforms, models
from torchvision.models import EfficientNet_B0_Weights

# Suppress warnings
warnings.filterwarnings("ignore")

# =========================
# DEVICE
# =========================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("\nUsing Device:", device)

# =========================
# DYNAMIC PATHS
# =========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_PATH = os.path.join(BASE_DIR, "dataset", "PlantVillage")
GENERAL_MODEL_PATH = os.path.join(BASE_DIR, "models", "best_augmented_full_model.pth")
SPECIALIST_MODEL_PATH = os.path.join(BASE_DIR, "models", "best_specialist_model.pth")
LABELS_PATH = os.path.join(BASE_DIR, "models", "labels.txt")
SPECIALIST_LABELS_PATH = os.path.join(BASE_DIR, "models", "pepper_potato_labels.txt")
RESULTS_FOLDER = os.path.join(BASE_DIR, "test_results")
TEST_IMAGES_FOLDER = os.path.join(RESULTS_FOLDER, "tested_images")

# =========================
# TIMESTAMP
# =========================
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

CSV_PATH = os.path.join(RESULTS_FOLDER, f"{timestamp}_test_results.csv")
EXCEL_PATH = os.path.join(RESULTS_FOLDER, f"{timestamp}_test_results.xlsx")
SUMMARY_PATH = os.path.join(RESULTS_FOLDER, f"{timestamp}_summary.txt")

# =========================
# CREATE FOLDERS
# =========================
os.makedirs(RESULTS_FOLDER, exist_ok=True)
os.makedirs(TEST_IMAGES_FOLDER, exist_ok=True)

# =========================
# LOAD LABELS
# =========================
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

print("\nClasses Loaded Successfully!")

# Load specialist classes dynamically to avoid size mismatch
if os.path.exists(SPECIALIST_LABELS_PATH):
    with open(SPECIALIST_LABELS_PATH, "r") as f:
        specialist_classes = [line.strip() for line in f.readlines()]
else:
    specialist_classes = class_names

# =========================
# LOAD GENERAL MODEL
# =========================
general_model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
general_model.classifier = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(general_model.classifier[1].in_features, 512),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(512, len(class_names))
)

if not os.path.exists(GENERAL_MODEL_PATH):
    print(f"❌ General model path not found at: {GENERAL_MODEL_PATH}")
    sys.exit(1)
general_model.load_state_dict(torch.load(GENERAL_MODEL_PATH, map_location=device))
general_model = general_model.to(device)
general_model.eval()

# =========================
# LOAD SPECIALIST MODEL
# =========================
specialist_model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
specialist_model.classifier = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(specialist_model.classifier[1].in_features, 512),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(512, len(specialist_classes))
)

if not os.path.exists(SPECIALIST_MODEL_PATH):
    print(f"❌ Specialist model path not found at: {SPECIALIST_MODEL_PATH}")
    sys.exit(1)
specialist_model.load_state_dict(torch.load(SPECIALIST_MODEL_PATH, map_location=device))
specialist_model = specialist_model.to(device)
specialist_model.eval()

print("\nEnsemble Models Loaded Successfully!")

# =========================
# IMAGE TRANSFORM (IMAGENET NORMALIZATION REQUIRED)
# =========================
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    # transforms.Normalize(
    #     mean=[0.485, 0.456, 0.406],
    #     std=[0.229, 0.224, 0.225]
    # )
])

# =========================
# COLLECT ALL IMAGES
# =========================
all_images = []

if not os.path.exists(DATASET_PATH):
    # Fallback to cleaned_dataset if PlantVillage dataset is missing
    ALT_DATASET_PATH = os.path.join(BASE_DIR, "cleaned_dataset")
    if os.path.exists(ALT_DATASET_PATH):
        DATASET_PATH = ALT_DATASET_PATH
        print(f"⚠️  PlantVillage dataset not found. Using Cleaned Dataset: {DATASET_PATH}")
    else:
        print(f"❌ Dataset path not found: {DATASET_PATH}")
        sys.exit(1)

for class_name in os.listdir(DATASET_PATH):
    class_path = os.path.join(DATASET_PATH, class_name)
    if not os.path.isdir(class_path):
        continue
    for image_name in os.listdir(class_path):
        image_path = os.path.join(class_path, image_name)
        all_images.append((image_path, class_name))

print(f"\nTotal Images Found: {len(all_images)}")

if len(all_images) == 0:
    print("❌ No images found in dataset path!")
    sys.exit(1)

# =========================
# RANDOMLY SELECT 200 IMAGES
# =========================
test_samples = random.sample(all_images, min(200, len(all_images)))
print(f"\nStarting Random Testing on {len(test_samples)} samples...\n")

# =========================
# RESULT STORAGE
# =========================
results = []
correct = 0
wrong = 0

# =========================
# TEST LOOP
# =========================
for idx, (image_path, actual_class) in enumerate(test_samples):
    try:
        # Load image
        image = Image.open(image_path).convert("RGB")
        image_name = os.path.basename(image_path)

        # Save test image copy
        shutil.copy(image_path, os.path.join(TEST_IMAGES_FOLDER, image_name))

        # Preprocess image with ImageNet normalisation
        input_tensor = transform(image).unsqueeze(0).to(device)

        # General model inference and top-3 probabilities
        with torch.no_grad():
            general_output = general_model(input_tensor)
            general_probs = torch.nn.functional.softmax(general_output[0], dim=0)
            general_confidence, general_predicted = torch.max(general_probs, 0)
            
            # Fetch top-3 predictions
            top3_probs, top3_indices = torch.topk(general_probs, min(3, len(class_names)))
            top3_list = []
            for prob_tensor, idx_tensor in zip(top3_probs, top3_indices):
                top3_list.append((class_names[idx_tensor.item()], prob_tensor.item() * 100))

        general_class = class_names[general_predicted.item()]
        general_confidence = general_confidence.item() * 100

        # Specialist model inference
        with torch.no_grad():
            specialist_output = specialist_model(input_tensor)
            specialist_probs = torch.nn.functional.softmax(specialist_output[0], dim=0)
            specialist_confidence_tensor, specialist_predicted = torch.max(specialist_probs, 0)

        specialist_class = specialist_classes[specialist_predicted.item()]
        specialist_confidence = specialist_confidence_tensor.item() * 100

        # Ensemble logic
        final_class = general_class
        final_confidence = general_confidence

        if specialist_confidence > 80:
            final_class = specialist_class
            final_confidence = specialist_confidence

        if final_confidence < 70:
            final_class = "Unknown Leaf"

        # Format Plant Name
        if final_class == "Unknown Leaf":
            plant_name = "Unknown"
        else:
            plant_name = final_class.split("_")[0]

        # ===================================
        # CORRECT vs WRONG (CASE-INSENSITIVE)
        # ===================================
        pred_clean = final_class.strip().lower()
        actual_clean = actual_class.strip().lower()
        
        status = "CORRECT"
        if pred_clean == actual_clean:
            correct += 1
        else:
            wrong += 1
            status = "WRONG"

        # Print result details
        print("\n===================================")
        print(f"TEST SAMPLE {idx+1}")
        print("===================================\n")
        print(f"Plant Name        : {plant_name}")
        print(f"Actual Disease    : {actual_class}")
        print(f"Predicted Disease : {final_class}")
        print(f"Confidence        : {final_confidence:.2f}%")
        print(f"Prediction Status : {status}")

        # If wrong, print the top-3 predictions for debugging
        if status == "WRONG":
            print("\n  [DEBUG] Top-3 General Class Predictions:")
            for rank, (name, conf) in enumerate(top3_list):
                print(f"    {rank+1}. {name}: {conf:.2f}%")

        print(f"\nProgress: Correct: {correct} | Wrong: {wrong}")

        # Store result row
        results.append({
            "Image Name": image_name,
            "Plant Name": plant_name,
            "Actual Disease": actual_class,
            "Predicted Disease": final_class,
            "Confidence (%)": round(final_confidence, 2),
            "Prediction Status": status,
            "Total Correct Predictions": correct,
            "Total Wrong Predictions": wrong
        })

    except Exception as e:
        print(f"\nError processing sample {image_path}: {e}")

# =========================
# FINAL RESULTS AND SUMMARY
# =========================
total = correct + wrong
accuracy = (correct / total) * 100 if total > 0 else 0.0

# Add final summary row to CSV
results.append({
    "Image Name": "FINAL SUMMARY",
    "Plant Name": "-",
    "Actual Disease": "-",
    "Predicted Disease": "-",
    "Confidence (%)": "-",
    "Prediction Status": "-",
    "Total Correct Predictions": correct,
    "Total Wrong Predictions": wrong
})

# Save tabular outputs
df = pd.DataFrame(results)
df.to_csv(CSV_PATH, index=False)
df.to_excel(EXCEL_PATH, index=False)

# Write human-readable summary
with open(SUMMARY_PATH, "w") as f:
    f.write("AGROSENTRY PIPELINE ACCURACY REPORT\n")
    f.write("===================================\n")
    f.write(f"Timestamp            : {timestamp}\n")
    f.write(f"Total Samples Tested : {total}\n")
    f.write(f"Correct Predictions  : {correct}\n")
    f.write(f"Wrong Predictions    : {wrong}\n")
    f.write(f"Overall Accuracy     : {accuracy:.2f}%\n")

print("\n===================================")
print("FINAL PIPELINE STATS SUMMARY")
print("===================================\n")
print(f"Total Samples Checked : {total}")
print(f"Correct Predictions   : {correct}")
print(f"Wrong Predictions     : {wrong}")
print(f"Final Ensemble Acc    : {accuracy:.2f}%")
print("\nGenerated artifacts:")
print(f"  - CSV Summary  : {CSV_PATH}")
print(f"  - Excel Report : {EXCEL_PATH}")
print(f"  - Text Summary : {SUMMARY_PATH}")
print("===================================")