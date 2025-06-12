import pandas as pd

df = pd.read_csv('/Users/anatatar/Desktop/Licenta/ai_models/data/labeled_ecg_images.csv')

# Print column names
print("📋 Available columns in labels.csv:")
print(df.columns)

# Show the first 5 rows
print("\n🔎 First 5 rows:")
print(df.head())
