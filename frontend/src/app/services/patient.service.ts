// src/app/services/patient.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Patient } from '../models/patient';
import { CreatePatientRequest } from '../models/patientrequest';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { MedicalRecord } from '../models/medicalrecord'; // Assuming you have a MedicalRecord model


@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly API_URL = `${environment.apiUrl}/patients`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('PatientService initialized with API_URL:', this.API_URL);
  }

  private getHttpOptions(): { headers: HttpHeaders } {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });

    console.log('HTTP Headers for request:', {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'No token'
    });

    return { headers };
  }

  getAllPatients(): Observable<Patient[]> {
    console.log('🔍 Fetching all patients from:', this.API_URL);

    return this.http.get<Patient[]>(this.API_URL, this.getHttpOptions())
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getPatientById(id: string): Observable<Patient> {
    const url = `${this.API_URL}/${id}`;
    console.log('🔍 Fetching patient by ID from:', url);

    return this.http.get<Patient>(url, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getPatientsByDoctor(doctorId: string): Observable<Patient[]> {
    const url = `${this.API_URL}/doctor/${doctorId}`;
    console.log('🔍 Fetching patients by doctor from:', url);

    return this.http.get<Patient[]>(url, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  createPatient(patient: CreatePatientRequest): Observable<Patient> {
    console.log('🔍 Creating patient:', patient);

    return this.http.post<Patient>(this.API_URL, patient, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    const url = `${this.API_URL}/${id}`;
    console.log('🔍 Updating patient at:', url, 'with data:', patient);

    return this.http.put<Patient>(url, patient, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deletePatient(id: string): Observable<void> {
    const url = `${this.API_URL}/${id}`;
    console.log('🔍 Deleting patient at:', url);

    return this.http.delete<void>(url, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  searchPatients(name: string): Observable<Patient[]> {
    const url = `${this.API_URL}/search?name=${encodeURIComponent(name)}`;
    console.log('🔍 Searching patients at:', url);

    return this.http.get<Patient[]>(url, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Test backend connection (no auth required)
  testConnection(): Observable<any> {
    const testUrl = `${environment.apiUrl}/test/health`;
    console.log('🔍 Testing connection to:', testUrl);

    return this.http.get(testUrl)
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Unknown error!';

    console.error('=== PATIENT SERVICE ERROR ===');
    console.error('Status:', error.status);
    console.error('Status Text:', error.statusText);
    console.error('URL:', error.url);
    console.error('Error object:', error);

    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Client Error: ${error.error.message}`;
      console.error('Client-side error:', error.error.message);
    } else {
      // Server-side errors
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized - Please login again';
          console.error('Authentication required');
          // Optionally redirect to login
          // this.authService.logout();
          break;
        case 403:
          errorMessage = 'Forbidden - You do not have permission to access this resource';
          console.error('Permission denied');
          break;
        case 404:
          errorMessage = 'Resource not found';
          console.error('API endpoint not found');
          break;
        case 500:
          errorMessage = 'Internal server error';
          console.error('Server error');
          break;
        case 0:
          errorMessage = 'Network error - Check if the server is running';
          console.error('Network connectivity issue');
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
          console.error('Other server error:', error.status, error.message);
      }
    }

    console.error('Final error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };


  getMedicalRecords(patientId: string): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(`${this.API_URL}/${patientId}/records`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  createMedicalRecord(patientId: string, record: any): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(`${this.API_URL}/${patientId}/records`, record, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateMedicalRecord(patientId: string, recordId: string, record: any): Observable<MedicalRecord> {
    return this.http.put<MedicalRecord>(`${this.API_URL}/${patientId}/records/${recordId}`, record, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deleteMedicalRecord(patientId: string, recordId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${patientId}/records/${recordId}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }
}
