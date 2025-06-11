export interface SavedEcgRecord {
  id: string;
  fileName: string;
  classification: string;
  confidence: number;
  uploadTimestamp: string;
  dateAdded: string;
  status: 'Pending' | 'Complete';
  normProbability: number;
  miProbability: number;
  lrProbability: number;
  hrProbability: number;
  reportUrl: string;
}
