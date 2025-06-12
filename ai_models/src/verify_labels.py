#!/usr/bin/env python3
import pandas as pd
from pathlib import Path
import argparse, sys

def main(csv_path: Path, png_root: Path, deep: bool):
    if not csv_path.exists():
        sys.exit(f"❌ CSV not found: {csv_path}")
    if not png_root.exists():
        sys.exit(f"❌ Image folder not found: {png_root}")

    df = pd.read_csv(csv_path)

    # build a lookup of every png below png_root (flat OR recursive)
    if deep:
        all_pngs = {p.name for p in png_root.rglob("*.png")}
    else:
        all_pngs = {p.name for p in png_root.glob("*.png")}

    # 1️⃣  make sure every PNG in the CSV actually exists
    missing = [f for f in df["filename"] if f not in all_pngs]
    print(f"Missing images: {len(missing)}")
    if missing:
        print("  → first 10:", missing[:10])

    # 2️⃣  duplicates
    dupes = df["filename"].duplicated().sum()
    print(f"Duplicate rows: {dupes}")

    # 3️⃣  class distribution
    print("\nLabel counts:")
    print(df[["MI","NORM","STTC","CD","HYP"]].sum())

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Verify PNG-label consistency.")
    ap.add_argument("--csv",
        default="/Users/anatatar/Desktop/Licenta/ai_models/data/results/labels.csv")
    ap.add_argument("--png_root",
        default="/Users/anatatar/Desktop/Licenta/ai_models/data/ecg_images")
    ap.add_argument("--deep", action="store_true",
        help="search png_root **recursively** (needed when images are stored in 00000/, 00001/, …)")
    args = ap.parse_args()

    main(Path(args.csv), Path(args.png_root), args.deep)
