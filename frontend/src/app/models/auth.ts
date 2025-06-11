export interface User {
  id: string;
  name: string;
  email: string;
  role: 'DOCTOR' | 'PATIENT';
  username?: string;
  phone?: string;
  birthdate?: string;
  gender?: string;
}
