import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpRequest,
  HttpResponse,
  HttpHeaders
} from '@angular/common/http';
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
  private readonly apiUrl = `${environment.apiUrl}/ecg`;
  private uploadProgressSubject = new BehaviorSubject<number>(0);
  public uploadProgress$ = this.uploadProgressSubject.asObservable();

  constructor(private http: HttpClient) {}

  uploadECGFiles(formData: FormData): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      headers: headers,
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

  uploadSingleECG(file: File, patientId: string, notes?: string): Observable<ECGUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    if (notes) {
      formData.append('notes', notes);
    }

    return this.http.post<ECGUploadResponse>(`${this.apiUrl}/upload/single`, formData);
  }

  getECGDetails(ecgId: string): Observable<ECGDetails> {
    return this.http.get<ECGDetails>(`${this.apiUrl}/${ecgId}`);
  }

  getPatientECGs(patientId: string): Observable<ECGDetails[]> {
    return this.http.get<ECGDetails[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getECGImage(ecgId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${ecgId}/image`, {
      responseType: 'blob'
    });
  }

  getGradCAM(ecgId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${ecgId}/gradcam`, {
      responseType: 'blob'
    });
  }

  downloadReport(ecgId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${ecgId}/report`, {
      responseType: 'blob'
    });
  }

  saveToPatientRecord(ecgId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${ecgId}/save-to-record`, {});
  }

  deleteECG(ecgId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${ecgId}`);
  }

  getECGHistory(page: number = 0, size: number = 10): Observable<any> {
    const params = { page: page.toString(), size: size.toString() };
    return this.http.get(`${this.apiUrl}/history`, { params });
  }

  reanalyzeECG(ecgId: string, parameters?: any): Observable<ECGUploadResponse> {
    return this.http.post<ECGUploadResponse>(`${this.apiUrl}/${ecgId}/reanalyze`, parameters || {});
  }

  getModelMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/metrics`);
  }

  validateECGFile(file: File): Observable<{ valid: boolean; message?: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ valid: boolean; message?: string }>(
      `${this.apiUrl}/validate`,
      formData
    );
  }

  getSupportedFormats(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/supported-formats`);
  }

  resetUploadProgress(): void {
    this.uploadProgressSubject.next(0);
  }
}
