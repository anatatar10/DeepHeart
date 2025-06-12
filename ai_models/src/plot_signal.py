import wfdb
import matplotlib.pyplot as plt
import numpy as np

# Set path to the ECG record (exclude .hea extension)
record_path = "/Users/anatatar/Desktop/Licenta/ai_models/data/ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3/records500/00000/00001_hr"

# Load the signal using WFDB
record = wfdb.rdrecord(record_path)

# Extract signal matrix and lead names
signal = record.p_signal  # shape: (5000 samples, 12 leads)
lead_names = record.sig_name
fs = record.fs  # Sampling frequency, e.g. 500 Hz
time = np.arange(signal.shape[0]) / fs  # time axis in seconds

# Plot all 12 leads stacked vertically
plt.figure(figsize=(12, 10))
for i in range(signal.shape[1]):
    offset = i * 3  # space between leads
    plt.plot(time, signal[:, i] + offset, label=lead_names[i])  # shift vertically
plt.xlabel("Time (s)", fontsize=30)
plt.ylabel("ECG Lead", fontsize=30)
plt.title("Raw ECG Signal – All 12 Leads", fontsize=30)
plt.yticks(np.arange(0, 12 * 3, 3), lead_names)
plt.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()
plt.savefig("../results/ecg_all_12_leads.png", dpi=300)
plt.show()
