import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from torchvision import transforms
from PIL import Image

# =========================
# PATHS
# =========================

DATASET_PATH = r"C:\Users\LENOVO\Desktop\AgroSentry_Project\dataset\PlantVillage"
AUGMENTED_PATH = r"C:\Users\LENOVO\Desktop\AgroSentry_Project\augmented_dataset"

IMAGE_SIZE = 224
AUGMENTATIONS_PER_IMAGE = 5

# =========================
# AUGMENTATION SETTINGS
# =========================

datagen = ImageDataGenerator(

    rotation_range=40,

    width_shift_range=0.2,
    height_shift_range=0.2,

    shear_range=0.2,

    zoom_range=0.2,

    horizontal_flip=True,
    vertical_flip=True,

    brightness_range=[0.8, 1.2],

    fill_mode='nearest'
)

# =========================
# CREATE OUTPUT FOLDER
# =========================

if not os.path.exists(AUGMENTED_PATH):
    os.makedirs(AUGMENTED_PATH)

print("\nCreating Augmented Dataset...\n")

# =========================
# PROCESS EACH CLASS
# =========================

for class_name in os.listdir(DATASET_PATH):

    class_path = os.path.join(DATASET_PATH, class_name)

    if not os.path.isdir(class_path):
        continue

    save_class_path = os.path.join(AUGMENTED_PATH, class_name)

    if not os.path.exists(save_class_path):
        os.makedirs(save_class_path)

    print(f"Processing Class: {class_name}")

    for img_name in os.listdir(class_path):

        img_path = os.path.join(class_path, img_name)

        try:

            img = tf.keras.preprocessing.image.load_img(
                img_path,
                target_size=(IMAGE_SIZE, IMAGE_SIZE)
            )

            x = tf.keras.preprocessing.image.img_to_array(img)

            x = np.expand_dims(x, axis=0)

            # Save original image
            img.save(os.path.join(save_class_path, img_name))

            i = 0

            for batch in datagen.flow(
                x,
                batch_size=1,
                save_to_dir=save_class_path,
                save_prefix='aug',
                save_format='jpg'
            ):

                i += 1

                if i >= AUGMENTATIONS_PER_IMAGE:
                    break

        except Exception as e:
            print(f"Error: {img_path}")
            print(e)

print("\nDataset Augmentation Completed Successfully!\n")

# python scripts/augment_dataset.py