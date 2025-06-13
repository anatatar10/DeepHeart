export interface EcgRecordDTO {
  id: string;
  patientId: string;
  fileName: string;
  classification: string;
  confidence: number;
  timestamp: string;
  status: string;
  description?: string;
  probabilities?: { [key: string]: number };
}
