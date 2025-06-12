import os
import pandas as pd
import matplotlib.pyplot as plt
from tensorflow.keras.preprocessing.image import load_img, img_to_array

image_dir = "/Users/anatatar/Desktop/Licenta/ai_models/data/ecg_images_final"
labels_df = pd.read_csv('/Users/anatatar/Desktop/Licenta/ai_models/data/labeled_ecg_images.csv')
target_classes = ['NORM', 'MI']
samples_per_class = 5
image_size = (224, 224)

# Filter only rows with exactly one of NORM or MI
filtered = labels_df[labels_df[target_classes].sum(axis=1) == 1]

# Plot samples per class
for class_name in target_classes:
    class_rows = filtered[filtered[class_name] == 1].head(samples_per_class)

    plt.figure(figsize=(12, 3))
    plt.suptitle(f"{class_name} Samples", fontsize=16)

    for i, (_, row) in enumerate(class_rows.iterrows()):
        filename = row['filename']
        img_loaded = False

        for subdir in os.listdir(image_dir):
            subdir_path = os.path.join(image_dir, subdir)
            full_path = os.path.join(subdir_path, filename)
            if os.path.exists(full_path):
                img = load_img(full_path, color_mode='grayscale', target_size=image_size)
                plt.subplot(1, samples_per_class, i + 1)
                plt.imshow(img, cmap='gray')
                plt.axis('off')
                plt.title(filename)
                img_loaded = True
                break

        if not img_loaded:
            print(f"❌ Image not found: {filename}")

    plt.tight_layout()
    plt.show()
