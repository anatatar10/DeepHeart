import os
import numpy as np
import pandas as pd
import ast
import glob
from tqdm import tqdm
import argparse


def label_ecg_images(ecg_images_dir, ptbxl_dir, output_file='labeled_ecg_images.csv'):
    """
    Label ECG images with one-hot vectors for diagnostic superclasses (MI, NORM, STTC, CD, HYP)

    Args:
        ecg_images_dir: Directory containing ECG images
        ptbxl_dir: Directory containing PTB-XL dataset
        output_file: File to save the labels to
    """
    print("Loading ECG images from:", ecg_images_dir)

    # Check if the directory exists
    if not os.path.exists(ecg_images_dir):
        raise FileNotFoundError(f"ECG images directory not found: {ecg_images_dir}")

    # For nested directories like ecg_images_final/00000/00001_hr-0.png
    image_files = []
    image_extensions = ['png', 'jpg', 'jpeg']

    # Recursively find all image files in all subdirectories
    for root, dirs, files in os.walk(ecg_images_dir):
        for file in files:
            if any(file.lower().endswith(f'.{ext}') for ext in image_extensions):
                image_files.append(os.path.join(root, file))

    print(f"Found {len(image_files)} image files")
    if len(image_files) == 0:
        print("WARNING: No image files found. Listing directory contents:")
        try:
            dir_contents = os.listdir(ecg_images_dir)
            print(f"Directory contents ({len(dir_contents)} items):")
            for item in dir_contents[:20]:  # Show first 20 items
                item_path = os.path.join(ecg_images_dir, item)
                if os.path.isdir(item_path):
                    print(f"  {item}/ (directory)")
                    # List contents of subdirectory
                    sub_contents = os.listdir(item_path)
                    if sub_contents:
                        print(f"    First few items in {item}/:")
                        for sub_item in sub_contents[:5]:
                            print(f"    - {sub_item}")
                        if len(sub_contents) > 5:
                            print(f"    - ... and {len(sub_contents) - 5} more items")
                else:
                    print(f"  {item} ({os.path.getsize(item_path)} bytes)")
            if len(dir_contents) > 20:
                print(f"  ... and {len(dir_contents) - 20} more items")
        except Exception as e:
            print(f"Error listing directory: {e}")

    # Locate PTB-XL database file
    print("Locating PTB-XL database files...")
    database_file = find_file(ptbxl_dir, 'ptbxl_database.csv')
    statements_file = find_file(ptbxl_dir, 'scp_statements.csv')

    if database_file is None:
        raise FileNotFoundError(
            f"PTB-XL database file (ptbxl_database.csv) not found in {ptbxl_dir} or its subdirectories")
    if statements_file is None:
        raise FileNotFoundError(
            f"SCP statements file (scp_statements.csv) not found in {ptbxl_dir} or its subdirectories")

    print(f"Found database file: {database_file}")
    print(f"Found statements file: {statements_file}")

    # Load database
    print("Loading PTB-XL database...")
    df = pd.read_csv(database_file)

    # Check if 'ecg_id' is in the columns
    if 'ecg_id' not in df.columns:
        print(f"Warning: 'ecg_id' column not found in database. Available columns: {df.columns.tolist()}")
        # Try to find an alternative ID column
        id_columns = [col for col in df.columns if 'id' in col.lower()]
        if id_columns:
            print(f"Using alternative ID column: {id_columns[0]}")
            df = df.set_index(id_columns[0])
        else:
            print("No suitable ID column found. Using first column as index.")
            df = df.set_index(df.columns[0])
    else:
        df = df.set_index('ecg_id')

    # Check if 'scp_codes' column exists
    if 'scp_codes' not in df.columns:
        print(f"Warning: 'scp_codes' column not found in database. Available columns: {df.columns.tolist()}")
        scp_columns = [col for col in df.columns if 'scp' in col.lower() or 'code' in col.lower()]
        if scp_columns:
            print(f"Using alternative SCP codes column: {scp_columns[0]}")
            df['scp_codes'] = df[scp_columns[0]]

    # Convert SCP codes to dictionary if they're strings
    try:
        df.scp_codes = df.scp_codes.apply(lambda x: ast.literal_eval(x) if isinstance(x, str) else x)
    except Exception as e:
        print(f"Error converting SCP codes: {e}")
        print("Sample of SCP codes:")
        print(df.scp_codes.head())

    # Load SCP statements to get diagnostic classes
    print("Loading SCP statements...")
    scp_df = pd.read_csv(statements_file)

    # Check if the index column exists
    if 0 not in scp_df.columns and scp_df.columns[0] != 0:
        # Try to use the first column as the index
        try:
            scp_df = scp_df.set_index(scp_df.columns[0])
            print(f"Using {scp_df.columns[0]} as index for SCP statements")
        except Exception as e:
            print(f"Error setting index for SCP statements: {e}")
    else:
        scp_df = scp_df.set_index(0)

    if 'diagnostic' not in scp_df.columns:
        diag_cols = [col for col in scp_df.columns if 'diag' in col.lower()]
        if diag_cols:
            print(f"Using alternative diagnostic column: {diag_cols[0]}")
            scp_df['diagnostic'] = scp_df[diag_cols[0]]
        else:
            print("No diagnostic column found. Assuming all statements are diagnostic.")
            scp_df['diagnostic'] = 1

    if 'diagnostic_class' not in scp_df.columns:
        class_cols = [col for col in scp_df.columns if 'class' in col.lower()]
        if class_cols:
            print(f"Using alternative class column: {class_cols[0]}")
            scp_df['diagnostic_class'] = scp_df[class_cols[0]]
        else:
            print("No diagnostic class column found. Using generic class names.")
            scp_df['diagnostic_class'] = 'UNKNOWN'

    diagnostic_df = scp_df[scp_df.diagnostic == 1]

    # Check if we have any diagnostic classes
    print(f"Found {len(diagnostic_df)} diagnostic statements")
    if len(diagnostic_df) == 0:
        print("WARNING: No diagnostic statements found. Sample of SCP statements:")
        print(scp_df.head())

    # Create mapping from SCP code to diagnostic superclass
    superclass_map = {}
    for code, row in diagnostic_df.iterrows():
        superclass = row.diagnostic_class
        if pd.notna(superclass):
            superclass_map[code] = superclass

    # List of diagnostic superclasses in PTB-XL
    superclasses = ['MI', 'NORM', 'STTC', 'CD', 'HYP']
    print(f"Using diagnostic superclasses: {superclasses}")

    # Process each image file and store results in a dictionary
    results = []
    for image_file in tqdm(image_files, desc="Labeling images"):
        try:
            # Get just the filename without full path
            filename = os.path.basename(image_file)

            # Try to extract ECG ID from filename
            ecg_id = extract_ecg_id_from_filename(filename)
            if ecg_id is None:
                print(f"Could not extract ECG ID from filename: {filename}, skipping")
                continue

            # Initialize one-hot vector with zeros
            one_hot = [0] * len(superclasses)

            # Check if the ECG ID exists in the database
            if ecg_id in df.index:
                # Get SCP codes for this ECG
                scp_codes = df.loc[ecg_id, 'scp_codes']

                # Get the diagnostic superclasses for this ECG
                ecg_superclasses = set()
                for code in scp_codes.keys():
                    if code in superclass_map:
                        ecg_superclasses.add(superclass_map[code])

                # Set the one-hot vector values
                for i, superclass in enumerate(superclasses):
                    if superclass in ecg_superclasses:
                        one_hot[i] = 1

                # Add to results
                results.append({
                    'filename': filename,
                    'ecg_id': ecg_id,
                    'values': one_hot
                })
            else:
                print(f"ECG ID {ecg_id} not found in the database, skipping")
        except Exception as e:
            print(f"Error processing image {image_file}: {e}")

    # Sort results by ECG ID
    results.sort(key=lambda x: x['ecg_id'])

    # Create the result DataFrame
    result_df = pd.DataFrame(columns=['filename'] + superclasses)
    for result in results:
        result_df.loc[len(result_df)] = [result['filename']] + result['values']

    # Save the result
    result_df.to_csv(output_file, index=False)
    print(f"Labels saved to {output_file}")
    print(f"Labeled {len(result_df)} files, sorted by ECG ID")

    # Print some statistics
    print("\nLabel statistics:")
    for superclass in superclasses:
        count = result_df[superclass].sum()
        percentage = (count / len(result_df)) * 100
        print(f"{superclass}: {count} ({percentage:.1f}%)")

    # Print samples of the labeled data
    print("\nSample of labeled data:")
    print(result_df.head(10))

    return result_df


def find_file(directory, filename):
    """
    Find a file in a directory or its subdirectories

    Args:
        directory: Directory to search
        filename: Name of the file to find

    Returns:
        Full path to the file if found, None otherwise
    """
    for root, dirs, files in os.walk(directory):
        if filename in files:
            return os.path.join(root, filename)
    return None


def extract_ecg_id_from_filename(filename):
    """
    Extract ECG ID from filename

    Args:
        filename: Name of the file, e.g., 00001_hr-0.png

    Returns:
        ECG ID as an integer if found, None otherwise
    """
    try:
        # Try different formats

        # Format: 00001_hr-0.png
        parts = filename.split('_')
        if len(parts) >= 2:
            ecg_id_str = parts[0]
            # If it's like ecg_00001.png
            if ecg_id_str.lower() == 'ecg':
                ecg_id_str = parts[1]

            # Handle potential dash extensions and file extensions
            ecg_id_str = ecg_id_str.split('-')[0]
            ecg_id_str = ecg_id_str.split('.')[0]

            # Extract just the digits
            ecg_id_str = ''.join(filter(str.isdigit, ecg_id_str))

            if ecg_id_str:
                return int(ecg_id_str)

        # Try extracting just numbers from the filename
        ecg_id_str = ''.join(filter(str.isdigit, filename))
        if ecg_id_str:
            return int(ecg_id_str)

        return None
    except (ValueError, IndexError, TypeError):
        return None


def main():
    parser = argparse.ArgumentParser(description='Label ECG images with one-hot vectors for diagnostic superclasses')
    parser.add_argument('--images_dir', type=str, required=True,
                        help='Directory containing ECG images')
    parser.add_argument('--ptbxl_dir', type=str, required=True,
                        help='Directory containing PTB-XL dataset')
    parser.add_argument('--output_file', type=str, default='labeled_ecg_images.csv',
                        help='File to save the labels to')

    args = parser.parse_args()

    try:
        label_ecg_images(args.images_dir, args.ptbxl_dir, args.output_file)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()