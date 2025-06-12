from pathlib import Path

IMG_ROOT = Path("/Users/anatatar/Desktop/Licenta/ai_models/data/ecg_images_final")
png_files = list(IMG_ROOT.rglob("*.png"))

print(f"✅ Total .png images found: {len(png_files)}")
