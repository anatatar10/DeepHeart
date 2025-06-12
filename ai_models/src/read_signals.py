import wfdb
from matplotlib import pyplot as plt

# Calea către fișierul fără extensie (fără .dat sau .hea)
record_path = '../data/ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3/records500/00000/00001_hr'

# Citește semnalul
record = wfdb.rdrecord(record_path)

# Accesează semnalul brut
ecg_signal = record.p_signal

plt.plot(ecg_signal[:, 0])
plt.title('ECG Signal - First Channel')
plt.xlabel('Samples')
plt.ylabel('Amplitude (mV)')
plt.show()