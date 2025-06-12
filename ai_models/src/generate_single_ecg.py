import subprocess
from pathlib import Path
from PIL import Image
from time import time

# === CONFIG === (same as your original script)
venv_python = "/Users/anatatar/Desktop/Licenta/ai_models/.venv/bin/python"
script_path = "/Users/anatatar/Desktop/Licenta/ai_models/src/ecg_image_kit/codes/ecg-image-generator/gen_ecg_image_from_data.py"

# Paths for the specific file
base_dir = Path(
    "/Users/anatatar/Desktop/Licenta/ai_models/data/ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3/records500")
raw_base_output_dir = Path("/Users/anatatar/Desktop/Licenta/ai_models/data/ecg_images_unclean_final")
clean_base_output_dir = Path("/Users/anatatar/Desktop/Licenta/ai_models/data/ecg_images_final")

subset_folder = "21000"
raw_output_dir = raw_base_output_dir / subset_folder
clean_output_dir = clean_base_output_dir / subset_folder

# Ensure output directories exist
raw_output_dir.mkdir(parents=True, exist_ok=True)
clean_output_dir.mkdir(parents=True, exist_ok=True)

# Parameters
resolution = 500
TOP_CROP = 320
BOTTOM_CROP = 150
TARGET_SIZE = (224, 224)

# The specific file that failed
dat_file = base_dir / subset_folder / "21054_hr.dat"
hea_file = dat_file.with_suffix(".hea")  # This should be 21054.hea


def process_single_file():
    try:
        print(f"Processing file: {dat_file}")

        # Verify input files exist
        if not dat_file.exists():
            return f"❌ ERROR: DAT file does not exist: {dat_file}"
        if not hea_file.exists():
            return f"❌ ERROR: Header file does not exist: {hea_file}"

        print(f"Input files verified. DAT: {dat_file}, HEA: {hea_file}")

        # Step 1: Generate image using subprocess
        print("Step 1: Generating raw ECG image...")

        cmd = [
            venv_python, str(script_path),
            "-i", str(dat_file),
            "-hea", str(hea_file),
            "-o", str(raw_output_dir),
            "-st", "0",
            "--resolution", str(resolution),
            "--pad_inches", "0",
            "--remove_lead_names",
            "--random_bw", "1",
            "--random_grid_present", "0",
            "--standard_grid_color", "0",
            "--calibration_pulse", "0"
        ]

        print(f"Running command: {' '.join(cmd)}")

        # Use subprocess with verbose output
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        stdout, stderr = process.communicate()

        if process.returncode != 0:
            print(f"❌ Subprocess failed with return code {process.returncode}")
            print(f"STDOUT: {stdout}")
            print(f"STDERR: {stderr}")
            return f"❌ Subprocess error: {stderr}"

        print("Raw image generation completed successfully")

        # Step 2: Crop and resize
        raw_image = raw_output_dir / f"{dat_file.stem}-0.png"
        if not raw_image.exists():
            return f"❌ Raw image not found: {raw_image}"

        print(f"Raw image found: {raw_image}")
        print("Step 2: Cropping and resizing image...")

        cleaned_image = clean_output_dir / f"{dat_file.stem}-0_clean.png"
        with Image.open(raw_image) as img:
            width, height = img.size
            print(f"Original image size: {width}x{height}")

            cropped = img.crop((0, TOP_CROP, width, height - BOTTOM_CROP))
            print(f"Cropped image size: {cropped.width}x{cropped.height}")

            resized = cropped.resize(TARGET_SIZE, Image.LANCZOS)
            print(f"Resized image size: {resized.width}x{resized.height}")

            resized.save(cleaned_image)
            print(f"Saved cleaned image: {cleaned_image}")

        return f"✅ Success: Processed {dat_file.stem}"

    except Exception as e:
        import traceback
        print(f"❌ Exception occurred: {e}")
        print(traceback.format_exc())
        return f"❌ Failed to process: {e}"


if __name__ == "__main__":
    print(f"Starting processing of failed file: {dat_file.name}")
    start_time = time()

    result = process_single_file()

    elapsed = time() - start_time
    print(f"\nProcessing completed in {elapsed:.2f} seconds")
    print(f"Result: {result}")

    # Verify the output file exists
    expected_output = clean_output_dir / f"{dat_file.stem}-0_clean.png"
    if expected_output.exists():
        print(f"✅ Output file exists: {expected_output}")
    else:
        print(f"❌ Output file still missing: {expected_output}")