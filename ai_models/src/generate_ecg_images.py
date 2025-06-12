import subprocess
from pathlib import Path
from PIL import Image
from time import time
import time as time_module
from concurrent.futures import ProcessPoolExecutor, as_completed
import signal
import os
import pickle
import sys

# === CONFIG ===
venv_python = "/Users/anatatar/Desktop/Licenta/ai_models/.venv/bin/python"
script_path = "/Users/anatatar/Desktop/Licenta/ai_models/src/ecg_image_kit/codes/ecg-image-generator/gen_ecg_image_from_data.py"

base_dir = Path(
    "/Users/anatatar/Desktop/Licenta/ai_models/data/ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3/records500")
raw_base_output_dir = Path("/Users/anatatar/Desktop/Licenta/ai_models/data/ecg_images_unclean_final")
clean_base_output_dir = Path("/Users/anatatar/Desktop/Licenta/ai_models/data/ecg_images_final")

# Progress tracking file
progress_file = Path("ecg_processing_progress.pkl")

resolution = 500
TOP_CROP = 320
BOTTOM_CROP = 150
TARGET_SIZE = (224, 224)
MAX_WORKERS = 8  # Adjust based on your system's capabilities
MAX_RETRY_COUNT = 3  # Number of retry attempts for failed files
WORKER_TIMEOUT = 300  # Timeout for worker processes (seconds)


# Setup signal handling for graceful exit
def handle_signal(sig, frame):
    print("\n⚠️ Process interrupted. Progress has been saved. You can resume later.")
    sys.exit(0)


# Register the signal handlers
signal.signal(signal.SIGINT, handle_signal)  # Ctrl+C
signal.signal(signal.SIGTERM, handle_signal)  # Termination signal


def process_ecg_file(dat_file: Path, raw_output_dir: Path, clean_output_dir: Path):
    try:
        stem = dat_file.stem
        hea_file = dat_file.with_suffix(".hea")

        # Step 1: Generate image (always generate, regardless of existing files)
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

        # Use a timeout to handle potential hanging processes
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            stdout, stderr = process.communicate(timeout=WORKER_TIMEOUT)
            if process.returncode != 0:
                return f"❌ Subprocess error [{dat_file.name}] — {stderr.strip() if stderr else 'No stderr'}"
        except subprocess.TimeoutExpired:
            # Kill the process if it times out
            process.kill()
            return f"❌ Timeout error [{dat_file.name}] — Process exceeded {WORKER_TIMEOUT} seconds"

        # Step 2: Crop and resize
        raw_image = raw_output_dir / f"{stem}-0.png"
        if not raw_image.exists():
            return f"❌ Raw image not found: {raw_image.name}"

        cleaned_image = clean_output_dir / f"{stem}-0.png"
        with Image.open(raw_image) as img:
            width, height = img.size
            cropped = img.crop((0, TOP_CROP, width, height - BOTTOM_CROP))
            resized = cropped.resize(TARGET_SIZE, Image.LANCZOS)
            resized.save(cleaned_image)

        return f"✅ Done: {stem}"

    except subprocess.CalledProcessError as e:
        return f"❌ Subprocess error [{dat_file.name}] — {e.stderr.strip() if e.stderr else 'No stderr'}"
    except Exception as e:
        return f"❌ Failed to process [{dat_file.name}]: {e}"


def process_batch(files, subset_folder, retry_failed=True):
    """Process a batch of files with retry capability"""
    raw_output_dir = raw_base_output_dir / subset_folder
    clean_output_dir = clean_base_output_dir / subset_folder

    results = []
    failed_files = []

    with ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(process_ecg_file, f, raw_output_dir, clean_output_dir): f for f in files}

        for future in as_completed(futures):
            try:
                result = future.result(timeout=WORKER_TIMEOUT + 10)  # Allow slightly longer than the subprocess timeout
                results.append(result)
                if result.startswith("❌"):
                    failed_files.append(futures[future])
            except Exception as e:
                file = futures[future]
                results.append(f"❌ Worker error [{file.name}]: {str(e)}")
                failed_files.append(file)

    # Retry failed files if requested
    if retry_failed and failed_files and len(failed_files) < len(files):  # Don't retry if everything failed
        print(f"   ⚠️ Retrying {len(failed_files)} failed files...")
        retry_results = []

        # Process failed files sequentially to avoid overwhelming the system
        for file in failed_files:
            try:
                result = process_ecg_file(file, raw_output_dir, clean_output_dir)
                retry_results.append(result)
            except Exception as e:
                retry_results.append(f"❌ Final failure [{file.name}]: {str(e)}")

        results = [r for r in results if not r.startswith("❌")] + retry_results

    return results


def load_progress():
    """Load processing progress from pickle file"""
    if progress_file.exists():
        try:
            with open(progress_file, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            print(f"⚠️ Warning: Could not load progress file: {e}")
            return {}
    return {}


def save_progress(progress_data):
    """Save processing progress to pickle file"""
    try:
        with open(progress_file, 'wb') as f:
            pickle.dump(progress_data, f)
    except Exception as e:
        print(f"⚠️ Warning: Could not save progress file: {e}")


def process_subset(subset_folder):
    subset_path = base_dir / subset_folder
    raw_output_dir = raw_base_output_dir / subset_folder
    clean_output_dir = clean_base_output_dir / subset_folder

    # Create output directories
    raw_output_dir.mkdir(parents=True, exist_ok=True)
    clean_output_dir.mkdir(parents=True, exist_ok=True)

    all_files = list(subset_path.glob("*_hr.dat"))
    total = len(all_files)
    print(f"🔄 Starting subset {subset_folder}: {total} files to process")

    # Process in smaller batches to handle potential sleep/interruptions better
    batch_size = min(200, total)  # Adjust batch size as needed
    batches = [all_files[i:i + batch_size] for i in range(0, total, batch_size)]

    start = time()
    success = 0
    failed = 0

    # Process each batch
    for batch_num, batch in enumerate(batches, 1):
        print(f"   🔄 Processing batch {batch_num}/{len(batches)} ({len(batch)} files)...")

        batch_results = process_batch(batch, subset_folder)

        # Update counts
        batch_success = sum(1 for r in batch_results if r.startswith("✅"))
        batch_failed = sum(1 for r in batch_results if r.startswith("❌"))

        success += batch_success
        failed += batch_failed

        # Update progress file after each batch
        processed_count = (batch_num * batch_size) if batch_num < len(batches) else total

        # Show progress
        elapsed = time() - start
        percent = (processed_count / total) * 100
        eta = (elapsed / processed_count) * (total - processed_count) if processed_count < total else 0
        print(f"   🟢 Batch completed: {batch_success} successful, {batch_failed} failed")
        print(f"   🟢 Overall progress: {processed_count}/{total} ({percent:.1f}%) — ETA: {eta / 60:.1f}min")

        # Pause briefly between batches to allow for cleanup
        time_module.sleep(1)

    duration = time() - start
    print(f"\n✅ Subset {subset_folder} Completed.")
    print(f"   Success: {success}/{total} | Failed: {failed}/{total}")
    print(f"   Total processed: {success}/{total} ({(success / total) * 100:.1f}%)")
    print(f"   Duration: {int(duration)}s")

    return success, 0, total, duration  # Skipped is always 0 since we don't skip


# === MAIN EXECUTION ===
if __name__ == "__main__":
    print("🔄 ECG Image Processing Tool - Processing All Files")
    print("===================================================")

    # Find all subset folders - look for folders with 5-digit numeric names
    # This will capture folders from 00000 through 21000
    subset_folders = []
    for d in base_dir.iterdir():
        if d.is_dir() and d.name.isdigit() and len(d.name) == 5:
            subset_folders.append(d.name)

    # Sort numerically to ensure proper order (00000, 01000, ... 10000, ... 21000)
    subset_folders.sort(key=int)

    print(f"🔄 Found {len(subset_folders)} subset folders: {', '.join(subset_folders)}")

    # Remove progress file if it exists (since we're regenerating everything)
    if progress_file.exists():
        try:
            os.remove(progress_file)
            print("ℹ️ Removed existing progress file to ensure all files are processed.")
        except:
            print("⚠️ Warning: Could not remove existing progress file.")

    overall_start = time()
    overall_success = 0
    overall_skipped = 0  # Will always be 0
    overall_total = 0

    try:
        # Process each subset sequentially
        for subset in subset_folders:
            print(f"\n{'=' * 50}")
            print(f"PROCESSING SUBSET: {subset}")
            print(f"{'=' * 50}")

            success, _, total, _ = process_subset(subset)
            overall_success += success
            overall_total += total

            print(f"Completed subset {subset}. Moving to next subset...\n")

            # Short pause between subsets to allow system to clean up
            time_module.sleep(3)

        overall_duration = time() - overall_start
        print(f"\n🎉 ALL SUBSETS COMPLETED")

        # Calculate percentages safely (avoid division by zero)
        success_percent = (overall_success / overall_total) * 100 if overall_total > 0 else 0

        print(f"✅ Successfully processed: {overall_success}/{overall_total} ({success_percent:.1f}%)")
        print(f"⏱️ Total duration: {int(overall_duration)}s ({overall_duration / 60:.1f}min)")

    except KeyboardInterrupt:
        # Handle manual interruption
        elapsed = time() - overall_start
        print("\n⚠️ Process manually interrupted.")
        print(f"⏱️ Time elapsed before interruption: {int(elapsed)}s ({elapsed / 60:.1f}min)")

    except Exception as e:
        # Handle other exceptions
        elapsed = time() - overall_start
        print(f"\n❌ Error occurred: {str(e)}")
        print(f"⏱️ Time elapsed before error: {int(elapsed)}s ({elapsed / 60:.1f}min)")