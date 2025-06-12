import tensorflow as tf
from tensorflow.keras import layers, models, callbacks, applications
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import matplotlib.pyplot as plt
import os
import time
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

# === CONFIG ===
DATASET_PATH = "/Users/anatatar/Desktop/Licenta/ai_models/data/ecg_images_final"
IMG_SIZE = (224, 224)  # Standard size for many pre-trained models
BATCH_SIZE = 64
EPOCHS = 50
MODEL_PATH = "/Users/anatatar/Desktop/Licenta/ai_models/models/ecg_classifier.h5"
RESULTS_DIR = "/Users/anatatar/Desktop/Licenta/ai_models/results"
os.makedirs(RESULTS_DIR, exist_ok=True)

# === Data Loading with Advanced Augmentation ===
train_datagen = ImageDataGenerator(
    rescale=1. / 255,
    validation_split=0.2,
    rotation_range=15,
    width_shift_range=0.15,
    height_shift_range=0.15,
    zoom_range=0.15,
    horizontal_flip=True,  # ECGs can be flipped in some cases
    brightness_range=(0.8, 1.2),
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(
    rescale=1. / 255,
    validation_split=0.2
)

print("Creating data generators...")
train_gen = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True,
    seed=42
)

val_gen = val_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False  # Don't shuffle validation to keep correct indices
)

# Print dataset info
print(f"Number of training samples: {train_gen.samples}")
print(f"Number of validation samples: {val_gen.samples}")
print(f"Number of classes: {train_gen.num_classes}")
class_names = list(train_gen.class_indices.keys())
print(f"Classes: {class_names}")
print(f"Class distribution: {[train_gen.classes.tolist().count(i) for i in range(train_gen.num_classes)]}")


# === Transfer Learning Model ===
def create_transfer_learning_model(input_shape, num_classes):
    # Use EfficientNetB0 as the base model - lighter and faster than other options
    base_model = applications.EfficientNetB0(
        include_top=False,
        weights='imagenet',
        input_shape=input_shape
    )

    # Freeze the base model layers
    base_model.trainable = False

    # Build the model
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.BatchNormalization(),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.5),
        layers.BatchNormalization(),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ])

    # Compile model
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    return model, base_model


# === Callbacks for Training ===
def get_callbacks(model_path):
    return [
        callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=0.00001,
            verbose=1
        ),
        callbacks.ModelCheckpoint(
            filepath=model_path,
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        # TensorBoard callback for better monitoring
        callbacks.TensorBoard(
            log_dir=os.path.join(RESULTS_DIR, 'logs'),
            histogram_freq=1
        )
    ]


# === Training Strategy ===
def train_model():
    # Create the model
    input_shape = (*IMG_SIZE, 3)
    model, base_model = create_transfer_learning_model(input_shape, train_gen.num_classes)
    model.summary()

    # Calculate steps per epoch
    steps_per_epoch = train_gen.samples // BATCH_SIZE
    validation_steps = val_gen.samples // BATCH_SIZE

    # Train with frozen base layers first
    print("\n=== Stage 1: Training only top layers ===")
    history1 = model.fit(
        train_gen,
        epochs=15,
        steps_per_epoch=steps_per_epoch,
        validation_data=val_gen,
        validation_steps=validation_steps,
        callbacks=get_callbacks(MODEL_PATH),
        verbose=1
    )

    # Fine-tuning: unfreeze some layers of the base model
    print("\n=== Stage 2: Fine-tuning with unfrozen layers ===")
    # Unfreeze the last few layers of the base model
    base_model.trainable = True
    for layer in base_model.layers[:-20]:  # Keep first layers frozen
        layer.trainable = False

    # Recompile with a lower learning rate
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    # Continue training
    history2 = model.fit(
        train_gen,
        epochs=EPOCHS,
        initial_epoch=len(history1.history['loss']),
        steps_per_epoch=steps_per_epoch,
        validation_data=val_gen,
        validation_steps=validation_steps,
        callbacks=get_callbacks(MODEL_PATH),
        verbose=1
    )

    # Combine histories
    history = {}
    for key in history1.history:
        history[key] = history1.history[key] + history2.history[key]

    return model, history


# === Evaluation & Visualization ===
def evaluate_model(model, history):
    # Plot training history
    plt.figure(figsize=(12, 5))

    # Plot accuracy
    plt.subplot(1, 2, 1)
    plt.plot(history['accuracy'])
    plt.plot(history['val_accuracy'])
    plt.title('Model Accuracy')
    plt.ylabel('Accuracy')
    plt.xlabel('Epoch')
    plt.legend(['Train', 'Validation'], loc='lower right')

    # Plot loss
    plt.subplot(1, 2, 2)
    plt.plot(history['loss'])
    plt.plot(history['val_loss'])
    plt.title('Model Loss')
    plt.ylabel('Loss')
    plt.xlabel('Epoch')
    plt.legend(['Train', 'Validation'], loc='upper right')

    plt.tight_layout()
    plt.savefig(os.path.join(RESULTS_DIR, 'training_history.png'))
    plt.show()

    # Evaluate on validation set
    print("\nEvaluating on validation set...")
    val_loss, val_acc = model.evaluate(val_gen, steps=val_gen.samples // BATCH_SIZE + 1)
    print(f"Validation Accuracy: {val_acc:.4f}")
    print(f"Validation Loss: {val_loss:.4f}")

    # Confusion matrix and classification report
    print("\nGenerating confusion matrix and classification report...")
    # Reset the generator to get all validation samples
    val_gen.reset()

    # Get predictions
    y_true = []
    y_pred = []
    batch_count = 0
    max_batches = val_gen.samples // BATCH_SIZE + 1

    for x_batch, y_batch in val_gen:
        batch_pred = model.predict(x_batch, verbose=0)
        y_true.extend(np.argmax(y_batch, axis=1))
        y_pred.extend(np.argmax(batch_pred, axis=1))

        batch_count += 1
        if batch_count >= max_batches:
            break

    # Limit to actual samples (in case of partial last batch)
    y_true = y_true[:val_gen.samples]
    y_pred = y_pred[:val_gen.samples]

    # Generate classification report
    report = classification_report(y_true, y_pred, target_names=class_names, digits=4)
    print("\nClassification Report:")
    print(report)

    # Save report to file
    with open(os.path.join(RESULTS_DIR, 'resnet_v1/classification_report_densenet.txt'), 'w') as f:
        f.write(report)

    # Generate confusion matrix
    cm = confusion_matrix(y_true, y_pred)

    # Plot confusion matrix
    plt.figure(figsize=(14, 12))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.xticks(rotation=90)
    plt.tight_layout()
    plt.savefig(os.path.join(RESULTS_DIR, 'confusion_matrix.png'))
    plt.show()

    return val_acc


# === Save Model for Deployment ===
def save_model_for_deployment(model):
    # Save the full model in h5 format
    model.save(MODEL_PATH, save_format='h5')
    print(f"Model saved to {MODEL_PATH}")

    # Save as TensorFlow Lite model for mobile deployment
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    tflite_path = MODEL_PATH.replace('.h5', '.tflite')
    with open(tflite_path, 'wb') as f:
        f.write(tflite_model)
    print(f"TFLite model saved to {tflite_path}")

    # Save class mapping
    class_mapping = {v: k for k, v in train_gen.class_indices.items()}
    class_mapping_path = os.path.join(os.path.dirname(MODEL_PATH), "class_mapping.txt")
    with open(class_mapping_path, 'w') as f:
        for idx, class_name in class_mapping.items():
            f.write(f"{idx}: {class_name}\n")
    print(f"Class mapping saved to {class_mapping_path}")


# === MAIN EXECUTION ===
if __name__ == "__main__":
    # Set memory growth for GPU
    physical_devices = tf.config.list_physical_devices('GPU')
    if len(physical_devices) > 0:
        try:
            for device in physical_devices:
                tf.config.experimental.set_memory_growth(device, True)
            print(f"Using {len(physical_devices)} GPU(s)")
        except:
            print("Memory growth setting failed")

    # Record start time
    start_time = time.time()

    # Train the model
    model, history = train_model()

    # Evaluate the model
    val_acc = evaluate_model(model, history)

    # Save the model for deployment
    save_model_for_deployment(model)

    # Print training summary
    training_time = time.time() - start_time
    print("\n=== Training Summary ===")
    print(f"Total training time: {training_time / 60:.2f} minutes")
    print(f"Final validation accuracy: {val_acc:.4f}")
    print(f"Model parameters: {model.count_params():,}")
    print("=========================")