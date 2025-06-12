import pandas as pd
import ast
from pathlib import Path
import shutil

# === CONFIG ===
database_csv = Path("/Users/anatatar/Desktop/Licenta/ai_models/data/ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3/ptbxl_database.csv")
scp_statements_csv = Path("/Users/anatatar/Desktop/Licenta/ai_models/data/ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3/scp_statements.csv")
clean_images_dir = Path("/Users/anatatar/Desktop/Licenta/ai_models/data/ecg_images_final")
output_dir = Path("/Users/anatatar/Desktop/Licenta/ai_models/data/dataset_superclasses")

output_dir.mkdir(parents=True, exist_ok=True)

# === Load metadata ===
df = pd.read_csv(database_csv)
df["scp_codes"] = df["scp_codes"].apply(ast.literal_eval)

scp_map = pd.read_csv(scp_statements_csv, index_col=0)
scp_map = scp_map[scp_map["diagnostic_class"].notna()]
scp_to_superclass = scp_map["diagnostic_class"].to_dict()

superclasses = ["NORM", "MI", "STTC", "CD", "HYP"]

# === Create output folders ===
for superclass in superclasses:
    (output_dir / superclass).mkdir(parents=True, exist_ok=True)

# === Process each row and copy files ===
count = 0
skipped = 0

for _, row in df.iterrows():
    filename = Path(row["filename_hr"]).stem + "-0_clean.png"
    scp_codes = row["scp_codes"]

    # Get list of mapped diagnostic classes for this row
    diag_classes = [scp_to_superclass.get(code) for code in scp_codes.keys()]
    diag_classes = list(set(filter(None, diag_classes)))  # Remove None, duplicates

    if not diag_classes:
        skipped += 1
        continue

    # Use the first valid superclass (can be improved later to handle multi-label cases)
    target_superclass = diag_classes[0]
    if target_superclass not in superclasses:
        skipped += 1
        continue

    # Copy the image
    # Extract folder like "00000" from the filename
    subfolder = filename.split("_")[0]
    image_path = clean_images_dir / subfolder / filename
    if image_path.exists():
        dest_path = output_dir / target_superclass / filename
        shutil.copy(image_path, dest_path)
        count += 1
    else:
        skipped += 1

print(f"✅ Done. {count} images organized.")
print(f"⚠️ Skipped {skipped} records (no image or no matching superclass).")
