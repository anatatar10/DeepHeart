import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClassificationDistribution {
  NORM: number;
  MI: number;
  STTC: number;
  CD: number;
  HYP: number;
}

export interface WeeklyTrends {
  date: string;
  uploads: number;
}

export interface ModelPerformance {
  accuracy: number;
  auc: number;
  sensitivity: number;
  specificity: number;
  lastUpdated: string;
}

export interface AnalyticsData {
  classificationDistribution: ClassificationDistribution;
  weeklyTrends: WeeklyTrends[];
  modelPerformance: ModelPerformance;
  totalProcessedThisMonth: number;
  averageProcessingTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = 'http://localhost:8080/api/analytics';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAnalyticsData(): Observable<AnalyticsData> {
    const headers = this.getAuthHeaders();
    return this.http.get<AnalyticsData>(`${this.apiUrl}/dashboard`, { headers });
  }

  getClassificationDistribution(): Observable<ClassificationDistribution> {
    const headers = this.getAuthHeaders();
    return this.http.get<ClassificationDistribution>(`${this.apiUrl}/distribution`, { headers });
  }

  getWeeklyTrends(): Observable<WeeklyTrends[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<WeeklyTrends[]>(`${this.apiUrl}/trends`, { headers });
  }

  getModelPerformance(): Observable<ModelPerformance> {
    const headers = this.getAuthHeaders();
    return this.http.get<ModelPerformance>(`${this.apiUrl}/performance`, { headers });
  }

  exportAnalyticsReport(): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/export/report`, {
      headers,
      responseType: 'blob'
    });
  }

  exportPatientData(): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/export/patients`, {
      headers,
      responseType: 'blob'
    });
  }
}
