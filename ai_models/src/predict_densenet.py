import sys
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import json

def get_clinical_description(condition):
    """Get clinical description for each condition"""
    descriptions = {
        'NORM': 'Normal ECG - No significant abnormalities detected',
        'MI': 'Myocardial Infarction - Heart attack indicators present',
        'STTC': 'ST/T wave changes - May indicate ischemia or other cardiac conditions',
        'CD': 'Conduction Disorders - Abnormal electrical conduction patterns',
        'HYP': 'Hypertrophy - Enlarged heart chambers detected'
    }
    return descriptions.get(condition, 'Unknown condition')

def get_confidence_level(confidence):
    """Categorize confidence level for clinical interpretation"""
    if confidence >= 70:
        return {"level": "High", "clinical_action": "High confidence in diagnosis"}
    elif confidence >= 50:
        return {"level": "Medium", "clinical_action": "Moderate confidence - consider clinical correlation"}
    elif confidence >= 30:
        return {"level": "Low", "clinical_action": "Low confidence - requires clinical evaluation"}
    else:
        return {"level": "Very Low", "clinical_action": "Very low confidence - manual review recommended"}

# Load model
model = load_model("/Users/anatatar/Desktop/Licenta/deepheart/ai_models/src/densenet/densenet_model.keras", compile=False)
labels = ['NORM', 'MI', 'STTC', 'CD', 'HYP']

# Load and preprocess image
img_path = sys.argv[1]
img = image.load_img(img_path, target_size=(224, 224))
img_array = image.img_to_array(img)
img_array = np.expand_dims(img_array, axis=0) / 255.0

# Predict
pred = model.predict(img_array, verbose=0)[0]

# Use normalized probabilities for primary result (most interpretable)
normalized_pred = pred / pred.sum()
probabilities = {label: round(prob * 100, 2) for label, prob in zip(labels, normalized_pred)}

# Primary diagnosis
primary_condition = max(probabilities.items(), key=lambda x: x[1])
confidence_info = get_confidence_level(primary_condition[1])

# Secondary conditions (above threshold)
threshold = 15.0  # 15% threshold for normalized probabilities
secondary_conditions = {label: pct for label, pct in probabilities.items()
                        if pct >= threshold and label != primary_condition[0]}

# Create clean, production-ready output
result = {
    "classification": primary_condition[0],
    "confidence": primary_condition[1],
    "probabilities": probabilities,
    "description": get_clinical_description(primary_condition[0]),
    "confidence_level": confidence_info["level"],
    "clinical_recommendation": confidence_info["clinical_action"],
    "secondary_findings": secondary_conditions if secondary_conditions else None,
    "model_info": {
        "model_type": "DenseNet121",
        "prediction_method": "normalized_sigmoid",
        "timestamp": None  # Will be added by your backend
    }
}

# Output clean JSON
print(json.dumps(result))