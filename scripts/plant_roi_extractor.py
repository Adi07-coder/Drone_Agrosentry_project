import os
import cv2
import numpy as np
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# =========================
# PATHS
# =========================

INPUT_DATASET = str(PROJECT_ROOT / "augmented_dataset")

OUTPUT_DATASET = str(PROJECT_ROOT / "roi_dataset")

# =========================
# CREATE OUTPUT FOLDER
# =========================

os.makedirs(OUTPUT_DATASET, exist_ok=True)

# =========================
# PROCESS EACH CLASS
# =========================

for class_name in os.listdir(INPUT_DATASET):

    class_input_path = os.path.join(
        INPUT_DATASET,
        class_name
    )

    if not os.path.isdir(class_input_path):
        continue

    class_output_path = os.path.join(
        OUTPUT_DATASET,
        class_name
    )

    os.makedirs(
        class_output_path,
        exist_ok=True
    )

    print(f"\nProcessing Class: {class_name}")

    # =====================
    # PROCESS IMAGES
    # =====================

    for image_name in os.listdir(class_input_path):

        image_path = os.path.join(
            class_input_path,
            image_name
        )

        try:

            image = cv2.imread(image_path)

            if image is None:
                continue

            # =====================
            # RESIZE
            # =====================

            image = cv2.resize(
                image,
                (640, 640)
            )

            # =====================
            # CONVERT TO HSV
            # =====================

            hsv = cv2.cvtColor(
                image,
                cv2.COLOR_BGR2HSV
            )

            # =====================
            # GREEN COLOR MASK
            # =====================

            lower_green = np.array(
                [25, 40, 40]
            )

            upper_green = np.array(
                [90, 255, 255]
            )

            mask = cv2.inRange(

                hsv,

                lower_green,

                upper_green
            )

            # =====================
            # REMOVE NOISE
            # =====================

            kernel = np.ones(
                (5, 5),
                np.uint8
            )

            mask = cv2.morphologyEx(

                mask,

                cv2.MORPH_OPEN,

                kernel
            )

            mask = cv2.morphologyEx(

                mask,

                cv2.MORPH_CLOSE,

                kernel
            )

            # =====================
            # FIND CONTOURS
            # =====================

            contours, _ = cv2.findContours(

                mask,

                cv2.RETR_EXTERNAL,

                cv2.CHAIN_APPROX_SIMPLE
            )

            if len(contours) == 0:
                continue

            # =====================
            # LARGEST CONTOUR
            # =====================

            largest_contour = max(

                contours,

                key=cv2.contourArea
            )

            # =====================
            # IGNORE SMALL OBJECTS
            # =====================

            area = cv2.contourArea(
                largest_contour
            )

            if area < 3000:
                continue

            # =====================
            # BOUNDING BOX
            # =====================

            x, y, w, h = cv2.boundingRect(
                largest_contour
            )

            # =====================
            # ADD PADDING
            # =====================

            padding = 20

            x = max(0, x - padding)

            y = max(0, y - padding)

            w = min(
                image.shape[1] - x,
                w + 2 * padding
            )

            h = min(
                image.shape[0] - y,
                h + 2 * padding
            )

            # =====================
            # CROP ROI
            # =====================

            roi = image[
                y:y+h,
                x:x+w
            ]

            # =====================
            # SAVE ROI IMAGE
            # =====================

            save_path = os.path.join(

                class_output_path,

                image_name
            )

            cv2.imwrite(
                save_path,
                roi
            )

        except Exception as e:

            print(
                f"Error: {image_name}"
            )

            print(e)

print("\nROI Dataset Created Successfully!")

# python scripts/plant_roi_extractor.py