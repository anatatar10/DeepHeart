import numpy as np
import os
import pandas as pd
import tensorflow as tf
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.metrics import AUC, Precision, Recall
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, roc_auc_score, average_precision_score,
    matthews_corrcoef, hamming_loss, multilabel_confusion_matrix
)
import matplotlib.pyplot as plt
import seaborn as sns
import json
from tqdm import tqdm

# --- Parameters ---
image_dir = "/Users/anatatar/Desktop/Licenta/ai_models/data/ecg_images_final"
csv_path = "/Users/anatatar/Desktop/Licenta/ai_models/data/labeled_ecg_images.csv"
target_classes = ['NORM', 'MI', 'STTC', 'CD', 'HYP']
image_size = (224, 224)
random_state = 42

# Create output directory if it doesn't exist
os.makedirs("densenet_v1", exist_ok=True)

# --- Load CSV ---
df = pd.read_csv(csv_path)

def find_image_path(filename):
    for folder in os.listdir(image_dir):
        path = os.path.join(image_dir, folder, filename)
        if os.path.exists(path):
            return path
    return None

df['image_path'] = df['filename'].apply(find_image_path)
df = df[df['image_path'].notnull()]
print(f"\u2705 Total usable samples (multi-label): {len(df)}")

# --- Train/Val/Test Split ---
train_df, test_df = train_test_split(df, test_size=0.15, random_state=random_state)
train_df, val_df = train_test_split(train_df, test_size=0.15, random_state=random_state)

def load_or_cache_images(df_subset, name):
    X_path = f"densenet_v1/X_{name}.npy"
    y_path = f"densenet_v1/y_{name}.npy"

    if os.path.exists(X_path) and os.path.exists(y_path):
        print(f"✅ Loading cached {name} data...")
        X = np.load(X_path)
        y = np.load(y_path)
    else:
        print(f"⏳ Caching {name} data for the first time...")
        X, y = [], []
        for _, row in tqdm(df_subset.iterrows(), total=len(df_subset), desc=f"Loading {name} images"):
            img = load_img(row['image_path'], color_mode='rgb', target_size=image_size)
            img_array = img_to_array(img) / 255.0
            label_vector = row[target_classes].values.astype(np.float32)
            X.append(img_array)
            y.append(label_vector)
        X, y = np.array(X), np.array(y)
        np.save(X_path, X)
        np.save(y_path, y)
        print(f"✅ Cached {name} data saved to disk.")

    return X, y

X_train, y_train = load_or_cache_images(train_df, "train")
X_val, y_val = load_or_cache_images(val_df, "val")
X_test, y_test = load_or_cache_images(test_df, "test")

# --- Define model ---
inputs = Input(shape=(224, 224, 3))
base_model = DenseNet121(include_top=False, weights='imagenet', input_tensor=inputs)
x = GlobalAveragePooling2D()(base_model.output)
x = Dropout(0.4)(x)
output = Dense(len(target_classes), activation='sigmoid')(x)
model = Model(inputs=inputs, outputs=output)

trainable_layers = 0
for i, layer in enumerate(base_model.layers):
    if i < len(base_model.layers) - 40:
        layer.trainable = False
    else:
        layer.trainable = True
        trainable_layers += 1
print(f"Trainable layers: {trainable_layers}")

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

# --- Training and Saving ---
early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=25,
    batch_size=8,
    callbacks=[early_stopping],
    verbose=1
)

model.save("densenet_v1/densenet_model.h5")
with open("densenet_v1/history.json", "w") as f:
    json.dump(history.history, f)

# --- Evaluation ---
results = model.evaluate(X_test, y_test, verbose=1)
y_pred_probs = model.predict(X_test)
y_pred_bin = (y_pred_probs > 0.5).astype(int)

np.save("densenet_v1/y_test.npy", y_test)
np.save("densenet_v1/y_pred_bin.npy", y_pred_bin)
np.save("densenet_v1/y_pred_probs.npy", y_pred_probs)

report = classification_report(y_test, y_pred_bin, target_names=target_classes, zero_division=0)
with open("densenet_v1/classification_report_densenet.txt", "w") as f:
    f.write(report)

with open("densenet_v1/all_metrics_densenet_v1.txt", "w") as f:
    f.write("Multi-label Classification Report:\n" + report + "\n")
    binary_acc = (y_test == y_pred_bin).mean()
    f.write(f"Binary accuracy: {binary_acc:.4f}\n")
    auroc_macro = roc_auc_score(y_test, y_pred_probs, average='macro')
    auroc_micro = roc_auc_score(y_test, y_pred_probs, average='micro')
    f.write(f"AUROC macro: {auroc_macro:.4f}\nAUROC micro: {auroc_micro:.4f}\n")
    auprc_macro = average_precision_score(y_test, y_pred_probs, average='macro')
    auprc_micro = average_precision_score(y_test, y_pred_probs, average='micro')
    f.write(f"AUPRC macro: {auprc_macro:.4f}\nAUPRC micro: {auprc_micro:.4f}\n")
    hamming = hamming_loss(y_test, y_pred_bin)
    f.write(f"Hamming Loss: {hamming:.4f}\n")
    subset_acc = np.all(y_test == y_pred_bin, axis=1).mean()
    f.write(f"Subset Accuracy: {subset_acc:.4f}\n")
    mcc = matthews_corrcoef(y_test.flatten(), y_pred_bin.flatten())
    f.write(f"MCC: {mcc:.4f}\n")

# --- Confusion Matrices ---
cm = multilabel_confusion_matrix(y_test, y_pred_bin)
np.save("densenet_v1/confusion_matrices.npy", cm)
with open("densenet_v1/confusion_matrices.txt", "w") as f:
    for i, name in enumerate(target_classes):
        f.write(f"{name}:\n{cm[i]}\n")

def plot_confusion_matrix(cm, class_name, output_path):
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=['Pred Neg', 'Pred Pos'],
        yticklabels=['Actual Neg', 'Actual Pos']
    )
    plt.title(f'Confusion Matrix - {class_name}')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()

for i, name in enumerate(target_classes):
    plot_confusion_matrix(cm[i], name, f"densenet_v1/confusion_matrix_{name}.png")
    norm_cm = cm[i].astype('float') / cm[i].sum(axis=1, keepdims=True)
    norm_cm = np.nan_to_num(norm_cm)
    plt.figure(figsize=(6, 5))
    sns.heatmap(norm_cm, annot=True, fmt=".2f", cmap='Purples',
                xticklabels=['Pred Neg', 'Pred Pos'],
                yticklabels=['Actual Neg', 'Actual Pos'])
    plt.title(f'Normalized Confusion Matrix - {name}')
    plt.tight_layout()
    plt.savefig(f"densenet_v1/normalized_confusion_matrix_{name}.png")
    plt.close()

# --- Training Curves ---
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
plt.savefig("densenet_v1/training_curves.png")
plt.show()

# --- Save per-image predictions ---
test_df_copy = test_df.copy()
test_df_copy['prediction'] = list(y_pred_bin.tolist())
test_df_copy.to_csv("densenet_v1/predicted_test_results.csv", index=False)

# --- Save metadata ---
with open("densenet_v1/metadata.txt", "w") as f:
    f.write("Model: DenseNet121\n")
    f.write("Image size: 224x224\n")
    f.write(f"Epochs trained: {len(history.history['loss'])}\n")
    f.write(f"Train samples: {len(X_train)}\n")
    f.write(f"Val samples: {len(X_val)}\n")
    f.write(f"Test samples: {len(X_test)}\n")
    f.write("Target classes: " + ', '.join(target_classes) + "\n")
