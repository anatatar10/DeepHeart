import numpy as np
import os
import pandas as pd
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, roc_auc_score, average_precision_score,
    matthews_corrcoef, hamming_loss, multilabel_confusion_matrix
)
import matplotlib.pyplot as plt

# --- Parameters ---
image_dir = "/Users/anatatar/Desktop/Licenta/ai_models/data/ecg_images_final"
csv_path = "/Users/anatatar/Desktop/Licenta/ai_models/data/labeled_ecg_images.csv"
target_classes = ['NORM', 'MI', 'STTC', 'CD', 'HYP']
image_size = (224, 224)
random_state = 42

# --- Load CSV ---
df = pd.read_csv(csv_path)

# Match filenames to actual image paths
def find_image_path(filename):
    for folder in os.listdir(image_dir):
        path = os.path.join(image_dir, folder, filename)
        if os.path.exists(path):
            return path
    return None

df['image_path'] = df['filename'].apply(find_image_path)
df = df[df['image_path'].notnull()]  # Keep only available images

print(f"✅ Total usable samples (multi-label): {len(df)}")

# --- Train/Val/Test Split ---
train_df, test_df = train_test_split(df, test_size=0.15, random_state=random_state)
train_df, val_df = train_test_split(train_df, test_size=0.15, random_state=random_state)

# --- Load images and labels ---
def load_multilabel_images(df_subset):
    X, y = [], []
    for _, row in df_subset.iterrows():
        img = load_img(row['image_path'], color_mode='rgb', target_size=image_size)
        img_array = img_to_array(img) / 255.0
        label_vector = row[target_classes].values.astype(np.float32)
        X.append(img_array)
        y.append(label_vector)
    return np.array(X), np.array(y)

X_train, y_train = load_multilabel_images(train_df)
X_val, y_val = load_multilabel_images(val_df)
X_test, y_test = load_multilabel_images(test_df)

# --- Define model ---
inputs = Input(shape=(224, 224, 3))
base_model = ResNet50(include_top=False, weights='imagenet', input_tensor=inputs)
x = GlobalAveragePooling2D()(base_model.output)
x = Dropout(0.4)(x)
output = Dense(len(target_classes), activation='sigmoid')(x)  # Multi-label output
model = Model(inputs=inputs, outputs=output)

# --- Freeze early layers, fine-tune deep layers ---
for layer in base_model.layers[:-100]:
    layer.trainable = False

from tensorflow.keras.metrics import AUC, Precision, Recall

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss='binary_crossentropy',
    metrics=[
        AUC(curve='ROC', multi_label=True, name='auc'),
        Precision(name='precision'),
        Recall(name='recall'),
        'accuracy'
    ]
)

early_stopping = EarlyStopping(
    monitor='val_loss',
    patience=5,
    restore_best_weights=True
)

# Then add to model.fit()
history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=25,  # Can keep this high
    batch_size=8,
    callbacks=[early_stopping],
    verbose=1
)

# --- Evaluate ---
results = model.evaluate(X_test, y_test, verbose=1)
print("\nResults array order:")
print(results)
print("\nNamed results:")
print(f"Test loss: {results[0]:.4f}")
print(f"Test AUC: {results[1]:.4f}")
print(f"Test precision: {results[2]:.4f}")
print(f"Test recall: {results[3]:.4f}")
print(f"Test accuracy: {results[4]:.4f}")

# --- Predict ---
y_pred_probs = model.predict(X_test)
y_pred_bin = (y_pred_probs > 0.5).astype(int)

# --- Save arrays for later use ---
np.save("resnet_v1/y_test.npy", y_test)
np.save("resnet_v1/y_pred_bin.npy", y_pred_bin)
np.save("resnet_v1/y_pred_probs.npy", y_pred_probs)

# --- Classification report ---
report = classification_report(y_test, y_pred_bin, target_names=target_classes, zero_division=0)
print("\n🔍 Multi-label Classification Report:")
print(report)
with open("resnet_v1/classification_report_densenet.txt", "w") as f:
    f.write(report)

# --- Metrics file ---
with open("resnet_v1/all_metrics_resnet_v1.txt", "w") as f:
    f.write("Multi-label Classification Report:\n")
    f.write(report + "\n")

    # Binary accuracy
    binary_acc = (y_test == y_pred_bin).mean()
    f.write(f"Binary accuracy: {binary_acc:.4f}\n")
    print(f"Binary accuracy: {binary_acc:.4f}")

    # AUROC (macro, micro, per-class)
    try:
        auroc_macro = roc_auc_score(y_test, y_pred_probs, average='macro')
        auroc_micro = roc_auc_score(y_test, y_pred_probs, average='micro')
        f.write(f"AUROC macro-average: {auroc_macro:.4f}\n")
        f.write(f"AUROC micro-average: {auroc_micro:.4f}\n")
        print(f"AUROC macro-average: {auroc_macro:.4f}")
        print(f"AUROC micro-average: {auroc_micro:.4f}")
        for i, name in enumerate(target_classes):
            auc = roc_auc_score(y_test[:, i], y_pred_probs[:, i])
            f.write(f"AUROC ({name}): {auc:.4f}\n")
            print(f"AUROC ({name}): {auc:.4f}")
    except Exception as e:
        f.write(f"AUROC calculation error: {e}\n")
        print(f"AUROC calculation error: {e}")

    # AUPRC (macro, micro, per-class)
    try:
        auprc_macro = average_precision_score(y_test, y_pred_probs, average='macro')
        auprc_micro = average_precision_score(y_test, y_pred_probs, average='micro')
        f.write(f"AUPRC macro-average: {auprc_macro:.4f}\n")
        f.write(f"AUPRC micro-average: {auprc_micro:.4f}\n")
        print(f"AUPRC macro-average: {auprc_macro:.4f}")
        print(f"AUPRC micro-average: {auprc_micro:.4f}")
        for i, name in enumerate(target_classes):
            ap = average_precision_score(y_test[:, i], y_pred_probs[:, i])
            f.write(f"AUPRC ({name}): {ap:.4f}\n")
            print(f"AUPRC ({name}): {ap:.4f}")
    except Exception as e:
        f.write(f"AUPRC calculation error: {e}\n")
        print(f"AUPRC calculation error: {e}")

    # Hamming Loss
    hamming = hamming_loss(y_test, y_pred_bin)
    f.write(f"Hamming Loss: {hamming:.4f}\n")
    print(f"Hamming Loss: {hamming:.4f}")

    # Subset Accuracy (exact match)
    subset_acc = np.all(y_test == y_pred_bin, axis=1).mean()
    f.write(f"Subset Accuracy (exact match ratio): {subset_acc:.4f}\n")
    print(f"Subset Accuracy (exact match ratio): {subset_acc:.4f}")

    # Matthews Correlation Coefficient (MCC)
    mcc = matthews_corrcoef(y_test.flatten(), y_pred_bin.flatten())
    f.write(f"Matthews Correlation Coefficient (MCC): {mcc:.4f}\n")
    print(f"Matthews Correlation Coefficient (MCC): {mcc:.4f}")

# --- Multilabel Confusion Matrix (per class) ---
cm = multilabel_confusion_matrix(y_test, y_pred_bin)
np.save("resnet_v1/confusion_matrices.npy", cm)
with open("resnet_v1/confusion_matrices.txt", "w") as f:
    for i, name in enumerate(target_classes):
        f.write(f"{name}:\n{cm[i]}\n")
        print(f"{name}:\n{cm[i]}\n")

# --- Plot and save training curves ---
plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
plt.plot(history.history["loss"], label="Train Loss")
plt.plot(history.history["val_loss"], label="Val Loss")
plt.legend()
plt.title("Loss Curve")

plt.subplot(1, 2, 2)
plt.plot(history.history["accuracy"], label="Train Acc")
plt.plot(history.history["val_accuracy"], label="Val Acc")
plt.legend()
plt.title("Accuracy Curve")

plt.tight_layout()
plt.savefig("training_curves.png")
plt.show()