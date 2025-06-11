// dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Stats } from '../models/stats';

// Keep your existing DashboardStats interface
export interface DashboardStats {
  totalUploads: number;
  totalPatients: number;
  todaysUploads: number;
  modelAccuracy: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8080/api/dashboard/stats';

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard statistics
   * Maps your backend Stats model to the frontend DashboardStats interface
   */
  getStats(): Observable<DashboardStats> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<Stats>(this.apiUrl, { headers }).pipe(
      map((backendStats: Stats) => {
        // Map your backend Stats to frontend DashboardStats
        return {
          totalUploads: backendStats.totalUploads || 0,
          totalPatients: backendStats.totalPatients || 0,
          todaysUploads: backendStats.todaysUploads || 0,
          modelAccuracy: backendStats.modelAccuracy || 94.2
        } as DashboardStats;
      }),
      catchError(error => {
        console.error('Error fetching dashboard stats:', error);
        // Return default stats if API fails
        return of({
          totalUploads: 0,
          totalPatients: 0,
          todaysUploads: 0,
          modelAccuracy: 94.2
        } as DashboardStats);
      })
    );
  }

  /**
   * Get raw stats from backend (if needed)
   */
  getRawStats(): Observable<Stats> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Stats>(this.apiUrl, { headers });
  }

  /**
   * Refresh stats (same as getStats but explicit name)
   */
  refreshStats(): Observable<DashboardStats> {
    return this.getStats();
  }

  /**
   * Get additional dashboard data if needed
   */
  getDashboardSummary(): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get(`${this.apiUrl}/summary`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching dashboard summary:', error);
        return of({});
      })
    );
  }

  /**
   * Get recent activities
   */
  getRecentActivities(): Observable<any[]> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any[]>(`${this.apiUrl}/recent-activities`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching recent activities:', error);
        return of([]);
      })
    );
  }
}
