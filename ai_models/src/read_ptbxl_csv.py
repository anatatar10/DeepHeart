import pandas as pd

dataset_path = "/Users/anatatar/Desktop/Licenta/ai_models/data/ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3/ptbxl_database.csv"

df = pd.read_csv(dataset_path)

# print(df.info()) # columns and types
print(df.head().to_string())