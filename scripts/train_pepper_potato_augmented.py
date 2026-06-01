import os
import torch
import torch.nn as nn
import torch.optim as optim
import matplotlib.pyplot as plt
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

from torchvision import datasets, transforms, models
from torchvision.models import EfficientNet_B0_Weights
from torch.utils.data import DataLoader, random_split

# =========================
# DEVICE CONFIG
# =========================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("\nUsing Device:", device)

# =========================
# PATHS
# =========================

DATASET_PATH = str(PROJECT_ROOT / "dataset" / "PlantVillage")

MODEL_PATH = str(PROJECT_ROOT / "models")

OUTPUTS_PATH = str(PROJECT_ROOT / "outputs")

# =========================
# CONFIG
# =========================

IMAGE_SIZE = 224

BATCH_SIZE = 35

EPOCHS = 50

LEARNING_RATE = 0.0001

# =========================
# TRANSFORMS
# =========================

transform = transforms.Compose([

    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    transforms.ToTensor(),

])

# =========================
# LOAD DATASET
# =========================

print("\nLoading Potato + Pepper Augmented Dataset...\n")

dataset = datasets.ImageFolder(

    DATASET_PATH,

    transform=transform
)

class_names = dataset.classes

print("Detected Classes:\n")

print(class_names)

print(f"\nTotal Images: {len(dataset)}")

# =========================
# TRAIN / VALIDATION SPLIT
# =========================

train_size = int(0.8 * len(dataset))

val_size = len(dataset) - train_size

train_dataset, val_dataset = random_split(

    dataset,

    [train_size, val_size]
)

print(f"\nTraining Images: {train_size}")

print(f"Validation Images: {val_size}")

# =========================
# DATALOADERS
# =========================

train_loader = DataLoader(

    train_dataset,

    batch_size=BATCH_SIZE,

    shuffle=True,

    num_workers=0
)

val_loader = DataLoader(

    val_dataset,

    batch_size=BATCH_SIZE,

    shuffle=False,

    num_workers=0
)

# =========================
# CREATE OUTPUT FOLDERS
# =========================

os.makedirs(MODEL_PATH, exist_ok=True)

os.makedirs(OUTPUTS_PATH, exist_ok=True)

# =========================
# SAVE LABELS
# =========================

with open(
    f"{MODEL_PATH}/pepper_potato_labels.txt",
    "w"
) as f:

    for item in class_names:
        f.write(item + "\n")

# =========================
# LOAD PRETRAINED MODEL
# =========================

print("\nLoading EfficientNetB0 Model...\n")

model = models.efficientnet_b0(

    weights=EfficientNet_B0_Weights.DEFAULT
)

# =========================
# PARTIAL FINE TUNING
# =========================

for param in model.features[:5].parameters():

    param.requires_grad = False

for param in model.features[5:].parameters():

    param.requires_grad = True

# =========================
# REPLACE CLASSIFIER
# =========================

model.classifier = nn.Sequential(

    nn.Dropout(0.5),

    nn.Linear(
        model.classifier[1].in_features,
        512
    ),

    nn.ReLU(),

    nn.Dropout(0.3),

    nn.Linear(
        512,
        len(class_names)
    )
)

model = model.to(device)

print("Model Loaded Successfully!")

# =========================
# LOSS & OPTIMIZER
# =========================

criterion = nn.CrossEntropyLoss()

optimizer = optim.Adam(

    model.parameters(),

    lr=LEARNING_RATE
)

# =========================
# TRAINING
# =========================

print("\nStarting Potato + Pepper Specialist Training...\n")

train_accuracies = []

val_accuracies = []

train_losses = []

val_losses = []

best_accuracy = 0

for epoch in range(EPOCHS):

    print(f"\n=========================")

    print(f"Epoch {epoch+1}/{EPOCHS}")

    print(f"=========================\n")

    # =====================
    # TRAIN
    # =====================

    model.train()

    running_loss = 0

    correct = 0

    total = 0

    for batch_idx, (images, labels) in enumerate(train_loader):

        images = images.to(device)

        labels = labels.to(device)

        optimizer.zero_grad()

        outputs = model(images)

        loss = criterion(outputs, labels)

        loss.backward()

        optimizer.step()

        running_loss += loss.item()

        _, predicted = torch.max(outputs, 1)

        total += labels.size(0)

        correct += (
            predicted == labels
        ).sum().item()

        if batch_idx % 20 == 0:

            print(

                f"Batch [{batch_idx}/{len(train_loader)}] "

                f"Loss: {loss.item():.4f}"
            )

    train_acc = 100 * correct / total

    train_loss = running_loss / len(train_loader)

    train_accuracies.append(train_acc)

    train_losses.append(train_loss)

    # =====================
    # VALIDATION
    # =====================

    model.eval()

    correct = 0

    total = 0

    running_loss = 0

    with torch.no_grad():

        for images, labels in val_loader:

            images = images.to(device)

            labels = labels.to(device)

            outputs = model(images)

            loss = criterion(outputs, labels)

            running_loss += loss.item()

            _, predicted = torch.max(outputs, 1)

            total += labels.size(0)

            correct += (
                predicted == labels
            ).sum().item()

    val_acc = 100 * correct / total

    val_loss = running_loss / len(val_loader)

    val_accuracies.append(val_acc)

    val_losses.append(val_loss)

    print(f"\nTrain Loss: {train_loss:.4f}")

    print(f"Train Accuracy: {train_acc:.2f}%")

    print(f"\nValidation Loss: {val_loss:.4f}")

    print(f"Validation Accuracy: {val_acc:.2f}%")

    # =====================
    # SAVE BEST MODEL
    # =====================

    if val_acc > best_accuracy:

        best_accuracy = val_acc

        torch.save(

            model.state_dict(),

            f"{MODEL_PATH}/best_specialist_model.pth"
        )

        print("\nBest Specialist Model Saved!")

# =========================
# SAVE FINAL MODEL
# =========================

torch.save(

    model.state_dict(),

    f"{MODEL_PATH}/final_specialist_model.pth"
)

print("\nFinal Specialist Model Saved!")

# =========================
# PLOT ACCURACY
# =========================

plt.figure(figsize=(10,5))

plt.plot(train_accuracies)

plt.plot(val_accuracies)

plt.title("Potato + Pepper Specialist Accuracy")

plt.xlabel("Epoch")

plt.ylabel("Accuracy")

plt.legend(["Train", "Validation"])

plt.savefig(

    f"{OUTPUTS_PATH}/specialist_accuracy.png"
)

plt.close()

# =========================
# PLOT LOSS
# =========================

plt.figure(figsize=(10,5))

plt.plot(train_losses)

plt.plot(val_losses)

plt.title("Potato + Pepper Specialist Loss")

plt.xlabel("Epoch")

plt.ylabel("Loss")

plt.legend(["Train", "Validation"])

plt.savefig(

    f"{OUTPUTS_PATH}/specialist_loss.png"
)

plt.close()

print("\nPotato + Pepper Specialist Training Completed Successfully!")

# python scripts/train_pepper_potato_augmented.py