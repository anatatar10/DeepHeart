from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout

model = Sequential([
    # First Convolutional Layer
    Conv2D(filters=32, kernel_size=(3, 3), activation='relu', input_shape=(128, 128, 1)),
    MaxPooling2D(pool_size=(2, 2)),

    # Second Convolutional Layer
    Conv2D(filters=64, kernel_size=(3, 3), activation='relu'),
    MaxPooling2D(pool_size=(2, 2)),

    # Third Convolutional Layer (optional, for deeper learning)
    Conv2D(filters=128, kernel_size=(3, 3), activation='relu'),
    MaxPooling2D(pool_size=(2, 2)),

    # Flattening and Dense Layers
    Flatten(),
    Dense(units=128, activation='relu'),
    Dropout(0.5),  # Helps prevent overfitting
    Dense(units=1, activation='sigmoid')  # Use softmax if you have more than 2 classes
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
