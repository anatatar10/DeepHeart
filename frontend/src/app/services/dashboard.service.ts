import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stats } from '../models/stats';


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

  getStats(): Observable<Stats> {
    const token = localStorage.getItem('auth_token');  // or sessionStorage
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Stats>(this.apiUrl, { headers });
  }
}
