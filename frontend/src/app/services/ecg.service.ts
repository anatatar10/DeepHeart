// services/ecg.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ECGUploadResponse {
  id: string;
  fileName: string;
  classification: string;
  confidence: number;
  probabilities: { [key: string]: number };
  timestamp: string;
  patientId: string;
  status: 'SUCCESS' | 'ERROR';
  message?: string;
}

export interface ECGBatchUploadResponse {
  results: ECGUploadResponse[];
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  batchId: string;
}

export interface ECGDetails {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  uploadTimestamp: string;
  classification: string;
  confidence: number;
  probabilities: { [key: string]: number };
  patientId: string;
  patientName: string;
  notes?: string;
  technician: string;
  imageUrl?: string;
  gradCamUrl?: string;
  reportUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ECGService {
  private readonly apiUrl = `${environment.apiUrl}/api/ecg`;
  private uploadProgressSubject = new BehaviorSubject<number>(0);

  public uploadProgress$ = this.uploadProgressSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Upload multiple ECG files for analysis
   */
  uploadECGFiles(formData: FormData): Observable<any> {
    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request(req).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
            this.uploadProgressSubject.next(progress);
            return { type: 'progress', progress };

          case HttpEventType.Response:
            this.uploadProgressSubject.next(100);
            return { type: 'result', data: event.body };

          default:
            return { type: 'other', event };
        }
      })
    );
  }

  /**
   * Upload a single ECG file
   */
  uploadSingleECG(file: File, patientId: string, notes?: string): Observable<ECGUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    if (notes) {
      formData.append('notes', notes);
    }

    return this.http.post<ECGUploadResponse>(`${this.apiUrl}/upload/single`, formData);
  }

  /**
   * Get ECG analysis details by ID
   */
  getECGDetails(ecgId: string): Observable<ECGDetails> {
    return this.http.get<ECGDetails>(`${this.apiUrl}/${ecgId}`);
  }

  /**
   * Get all ECGs for a patient
   */
  getPatientECGs(patientId: string): Observable<ECGDetails[]> {
    return this.http.get<ECGDetails[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  /**
   * Get ECG image
   */
  getECGImage(ecgId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${ecgId}/image`, {
      responseType: 'blob'
    });
  }

  /**
   * Get Grad-CAM visualization
   */
  getGradCAM(ecgId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${ecgId}/gradcam`, {
      responseType: 'blob'
    });
  }

  /**
   * Download PDF report
   */
  downloadReport(ecgId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${ecgId}/report`, {
      responseType: 'blob'
    });
  }

  /**
   * Save ECG result to patient record
   */
  saveToPatientRecord(ecgId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${ecgId}/save-to-record`, {});
  }

  /**
   * Delete ECG record
   */
  deleteECG(ecgId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${ecgId}`);
  }

  /**
   * Get ECG analysis history
   */
  getECGHistory(page: number = 0, size: number = 10): Observable<any> {
    const params = { page: page.toString(), size: size.toString() };
    return this.http.get(`${this.apiUrl}/history`, { params });
  }

  /**
   * Re-analyze ECG with different parameters
   */
  reanalyzeECG(ecgId: string, parameters?: any): Observable<ECGUploadResponse> {
    return this.http.post<ECGUploadResponse>(`${this.apiUrl}/${ecgId}/reanalyze`, parameters || {});
  }

  /**
   * Get model performance metrics
   */
  getModelMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/metrics`);
  }

  /**
   * Validate ECG file before upload
   */
  validateECGFile(file: File): Observable<{ valid: boolean; message?: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ valid: boolean; message?: string }>(
      `${this.apiUrl}/validate`,
      formData
    );
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/supported-formats`);
  }

  /**
   * Reset upload progress
   */
  resetUploadProgress(): void {
    this.uploadProgressSubject.next(0);
  }
}

// services/patient.service.ts
@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly apiUrl = `${environment.apiUrl}/api/patients`;

  constructor(private http: HttpClient) {}

  getPatients(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getPatient(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createPatient(patient: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, patient);
  }

  updatePatient(id: string, patient: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, patient);
  }

  deletePatient(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

// services/notification.service.ts
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  showError(message: string): void {
    this.showNotification(message, 'error');
  }

  showWarning(message: string): void {
    this.showNotification(message, 'warning');
  }

  showInfo(message: string): void {
    this.showNotification(message, 'info');
  }

  private showNotification(message: string, type: string): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-base);
      box-shadow: var(--shadow-lg);
      z-index: 1001;
      max-width: 300px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    notification.innerHTML = `
      <span>${this.getNotificationIcon(type)}</span>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  private getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  }
}
