export interface CreatePatientRequest {
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: string;
  age: number | null; // Allow null values
  bloodPressure: string;
  smokingStatus: string;
  doctorId?: number;
}
