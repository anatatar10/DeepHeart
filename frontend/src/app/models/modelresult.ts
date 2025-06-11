export interface ModelResult {
  model: string;
  classification: string;
  confidence: number;
  probabilities: { [key: string]: number };
  fileName: string;
  timestamp: string;
  description: string;
  confidence_level: string;
  clinical_recommendation: string;
  secondary_findings?: { [key: string]: number };
  model_info?: {
    model_type: string;
    prediction_method: string;
  };
}
