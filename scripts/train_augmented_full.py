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

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))

# =========================
# PATHS
# =========================

DATASET_PATH = str(PROJECT_ROOT / "augmented_dataset")

MODEL_PATH = str(PROJECT_ROOT / "models")

OUTPUTS_PATH = str(PROJECT_ROOT / "outputs")

# =========================
# CONFIG
# =========================

IMAGE_SIZE = 224

BATCH_SIZE = 32

EPOCHS = 30

LEARNING_RATE = 0.0001

EARLY_STOP_PATIENCE = 7

UNFREEZE_EPOCH = 5  # Start partial fine-tuning after this epoch

# =========================
# TRANSFORMS
# =========================
# ImageNet normalization is REQUIRED for EfficientNetB0.
# The pretrained weights expect inputs normalized to ImageNet statistics.

train_transform = transforms.Compose([

    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    # --- Data Augmentation (train only) ---
    transforms.RandomHorizontalFlip(p=0.5),

    transforms.RandomVerticalFlip(p=0.3),

    transforms.RandomRotation(degrees=15),

    transforms.ColorJitter(
        brightness=0.2,
        contrast=0.2,
        saturation=0.2,
        hue=0.05
    ),

    transforms.ToTensor(),

    # --- ImageNet Normalization (REQUIRED) ---
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

val_transform = transforms.Compose([

    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# =========================
# LOAD DATASET
# =========================

print("\nLoading Dataset...\n")

full_dataset = datasets.ImageFolder(DATASET_PATH)

class_names = full_dataset.classes

num_classes = len(class_names)

print(f"Detected {num_classes} Classes:")
for cls in class_names:
    print(f"  - {cls}")

print(f"\nTotal Images: {len(full_dataset)}")

# =========================
# TRAIN / VALIDATION SPLIT
# =========================

train_size = int(0.8 * len(full_dataset))

val_size = len(full_dataset) - train_size

train_indices, val_indices = random_split(
    range(len(full_dataset)),
    [train_size, val_size]
)

# Apply different transforms to train/val subsets
from torch.utils.data import Subset

class TransformSubset(torch.utils.data.Dataset):
    def __init__(self, dataset, indices, transform):
        self.dataset = dataset
        self.indices = indices
        self.transform = transform

    def __len__(self):
        return len(self.indices)

    def __getitem__(self, idx):
        image, label = self.dataset[self.indices[idx]]
        if self.transform:
            image = self.transform(image)
        return image, label

# Load images as PIL (no transform on base dataset)
full_dataset_raw = datasets.ImageFolder(DATASET_PATH)

train_dataset = TransformSubset(full_dataset_raw, train_indices.indices, train_transform)

val_dataset = TransformSubset(full_dataset_raw, val_indices.indices, val_transform)

print(f"\nTraining Images  : {len(train_dataset)}")
print(f"Validation Images: {len(val_dataset)}")

# =========================
# DATALOADERS
# =========================

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=0,
    pin_memory=True if device.type == "cuda" else False
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0,
    pin_memory=True if device.type == "cuda" else False
)

# =========================
# CREATE OUTPUT FOLDERS
# =========================

os.makedirs(MODEL_PATH, exist_ok=True)
os.makedirs(OUTPUTS_PATH, exist_ok=True)

# =========================
# SAVE LABELS
# =========================

labels_path = os.path.join(MODEL_PATH, "labels.txt")

with open(labels_path, "w") as f:
    for item in class_names:
        f.write(item + "\n")

print(f"\nLabels saved: {labels_path}")

# =========================
# LOAD PRETRAINED MODEL
# =========================

print("\nLoading EfficientNetB0 (ImageNet pretrained)...\n")

model = models.efficientnet_b0(
    weights=EfficientNet_B0_Weights.DEFAULT
)

# =========================
# FREEZE ALL LAYERS INITIALLY
# =========================

for param in model.parameters():
    param.requires_grad = False

# =========================
# REPLACE CLASSIFIER HEAD
# =========================

in_features = model.classifier[1].in_features

model.classifier = nn.Sequential(

    nn.Dropout(0.5),

    nn.Linear(in_features, 512),

    nn.ReLU(),

    nn.Dropout(0.3),

    nn.Linear(512, num_classes)
)

model = model.to(device)

print("EfficientNetB0 loaded. Classifier head replaced.")
print(f"Output classes: {num_classes}")

# =========================
# LOSS & OPTIMIZER
# =========================

criterion = nn.CrossEntropyLoss()

optimizer = optim.Adam(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr=LEARNING_RATE
)

# =========================
# LR SCHEDULER (Cosine Annealing)
# =========================

scheduler = optim.lr_scheduler.CosineAnnealingLR(
    optimizer,
    T_max=EPOCHS,
    eta_min=1e-6
)

# =========================
# TRAINING LOOP
# =========================

print("\nStarting Training...\n")

train_accuracies = []
val_accuracies = []
train_losses = []
val_losses = []

best_val_accuracy = 0
patience_counter = 0

for epoch in range(EPOCHS):

    print(f"\n{'='*50}")
    print(f"Epoch {epoch+1}/{EPOCHS}")
    print(f"{'='*50}")

    # =========================
    # PARTIAL FINE-TUNING
    # Unfreeze last 2 feature blocks after UNFREEZE_EPOCH
    # =========================

    if epoch == UNFREEZE_EPOCH:

        print("\n>>> Unfreezing last 2 feature blocks for fine-tuning...")

        for param in model.features[-2:].parameters():
            param.requires_grad = True

        # Re-init optimizer to include unfrozen params
        optimizer = optim.Adam(
            filter(lambda p: p.requires_grad, model.parameters()),
            lr=LEARNING_RATE * 0.1  # Lower LR for fine-tuning
        )

        scheduler = optim.lr_scheduler.CosineAnnealingLR(
            optimizer,
            T_max=EPOCHS - UNFREEZE_EPOCH,
            eta_min=1e-7
        )

    # =========================
    # TRAIN PHASE
    # =========================

    model.train()

    running_loss = 0.0
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
        correct += (predicted == labels).sum().item()

        if batch_idx % 20 == 0:
            print(f"  Batch [{batch_idx:3d}/{len(train_loader)}] Loss: {loss.item():.4f}")

    train_acc = 100.0 * correct / total
    train_loss = running_loss / len(train_loader)

    train_accuracies.append(train_acc)
    train_losses.append(train_loss)

    # =========================
    # VALIDATION PHASE
    # =========================

    model.eval()

    correct = 0
    total = 0
    running_loss = 0.0

    with torch.no_grad():

        for images, labels in val_loader:

            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)

            loss = criterion(outputs, labels)

            running_loss += loss.item()

            _, predicted = torch.max(outputs, 1)

            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    val_acc = 100.0 * correct / total
    val_loss = running_loss / len(val_loader)

    val_accuracies.append(val_acc)
    val_losses.append(val_loss)

    current_lr = optimizer.param_groups[0]["lr"]

    print(f"\n  Train Loss : {train_loss:.4f} | Train Acc : {train_acc:.2f}%")
    print(f"  Val   Loss : {val_loss:.4f} | Val   Acc : {val_acc:.2f}%")
    print(f"  LR         : {current_lr:.6f}")

    scheduler.step()

    # =========================
    # SAVE BEST MODEL
    # =========================

    if val_acc > best_val_accuracy:

        best_val_accuracy = val_acc
        patience_counter = 0

        torch.save(
            model.state_dict(),
            os.path.join(MODEL_PATH, "best_augmented_full_model.pth")
        )

        print(f"\n  ✅ Best model saved! Val Acc: {best_val_accuracy:.2f}%")

    else:

        patience_counter += 1
        print(f"\n  Early stop patience: {patience_counter}/{EARLY_STOP_PATIENCE}")

        if patience_counter >= EARLY_STOP_PATIENCE:

            print(f"\n⚠️  Early stopping triggered at epoch {epoch+1}")
            break

# =========================
# SAVE FINAL MODEL
# =========================

torch.save(
    model.state_dict(),
    os.path.join(MODEL_PATH, "final_augmented_full_model.pth")
)

print("\nFinal model saved!")

# =========================
# PLOT ACCURACY
# =========================

plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.plot(train_accuracies, label="Train", marker="o")
plt.plot(val_accuracies, label="Validation", marker="o")
plt.title("Model Accuracy")
plt.xlabel("Epoch")
plt.ylabel("Accuracy (%)")
plt.legend()
plt.grid(True)

# =========================
# PLOT LOSS
# =========================

plt.subplot(1, 2, 2)
plt.plot(train_losses, label="Train", marker="o")
plt.plot(val_losses, label="Validation", marker="o")
plt.title("Model Loss")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.legend()
plt.grid(True)

plt.tight_layout()

plt.savefig(os.path.join(OUTPUTS_PATH, "augmented_full_training.png"), dpi=150)

plt.close()

# =========================
# FINAL SUMMARY
# =========================

print("\n" + "="*50)
print("TRAINING COMPLETE")
print("="*50)
print(f"Best Validation Accuracy : {best_val_accuracy:.2f}%")
print(f"Classes                  : {num_classes}")
print(f"Models saved to          : {MODEL_PATH}")
print(f"Plot saved to            : {OUTPUTS_PATH}")

# python scripts/train_augmented_full.py