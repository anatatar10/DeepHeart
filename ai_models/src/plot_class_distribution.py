#!/usr/bin/env python3
import ast
from collections import Counter
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

BASE = Path("/Users/anatatar/Desktop/Licenta/ai_models/data/ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3")

# ---------- load PTB-XL metadata ----------
df = pd.read_csv(BASE / "ptbxl_database.csv")
df["scp_codes"] = df["scp_codes"].apply(ast.literal_eval)

# ---------- map SCP-codes → diagnostic superclass ----------
scp_map = pd.read_csv(BASE / "scp_statements.csv", index_col=0)
scp_map = scp_map[scp_map["diagnostic_class"].notna()]
scp_to_super = scp_map["diagnostic_class"].to_dict()

SUPERCLASSES = ["NORM", "MI", "STTC", "CD", "HYP"]   # display order

# ---------- count (deduplicated per record) ----------
super_counts = Counter()

for codes in df["scp_codes"]:
    # unique superclasses for *this* record
    rec_supers = {scp_to_super[c] for c in codes if c in scp_to_super}
    super_counts.update(rec_supers)        # one hit per superclass only

# make sure all five keys are present
super_counts = {cls: super_counts.get(cls, 0) for cls in SUPERCLASSES}

# ---------- plot ----------
plt.figure(figsize=(10, 6))
bars = plt.bar(super_counts.keys(), super_counts.values(), width=0.6)

plt.title("PTB-XL diagnostic superclass distribution", fontsize=18)
plt.xlabel("Superclass", fontsize=16)
plt.ylabel("# ECG records", fontsize=16)
plt.xticks(fontsize=14)
plt.yticks(fontsize=14)

for bar in bars:
    h = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2, h + 50, f"{h:,}", ha="center", va="bottom", fontsize=12)

plt.tight_layout()
out_png = Path("/Users/anatatar/Desktop/Licenta/ai_models/results/class_distribution.png")
out_png.parent.mkdir(parents=True, exist_ok=True)
plt.savefig(out_png, dpi=300)
plt.show()

print("✅ distribution saved to", out_png)
