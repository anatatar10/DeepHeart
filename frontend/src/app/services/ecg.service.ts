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

  downloadReport(ecgId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${ecgId}/report`, {
      responseType: 'blob'
    });
  }

  saveToPatientRecord(ecgId: string): Observable<any> {
    const url = `${this.apiUrl}/${ecgId}/save-to-record`;

    const token = localStorage.getItem('auth_token');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.post(url, {}, { headers: headers });
  }


}
