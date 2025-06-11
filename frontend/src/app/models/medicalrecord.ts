export interface MedicalRecord {
  id?: number;
  patientId: number;
  date: string;
  diagnosis: string;
  treatment: string;
  medications: string;
  notes: string;
  doctorName: string;
  visitType: string;
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
  }
}
