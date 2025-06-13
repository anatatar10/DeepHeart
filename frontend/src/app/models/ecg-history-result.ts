export interface ECGHistoryResult {
  id: string;
  fileName: string;
  classification: string;
  confidence: number;
  probabilities: { [key: string]: number };
  description: string;
  timestamp: string;
  status: string;
  patientId: string;
}
