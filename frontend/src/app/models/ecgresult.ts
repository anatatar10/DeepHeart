// models/ecgresult.ts - Updated ECGResult interface

export interface ECGResult {
  id?: string;
  model: string;
  classification: string;
  confidence: number;
  probabilities: { [key: string]: number };
  fileName: string;
  timestamp: string;
  description: string;
  confidence_level: string;
  clinical_recommendation: string;
  secondary_findings: { [key: string]: any };
  model_info: { [key: string]: any };
  model_agreement?: {
    models_agree: boolean;
    densenet_primary: string;
    resnet_primary: string;
    agreement_note: string;
  };
  patientId?: string;
  savedToRecord?: boolean;
}
