import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard-patient',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-patient.component.html',
  styleUrls: ['./dashboard-patient.component.scss']
})
export class DashboardPatientComponent implements OnInit {

  currentUser: any;
  stats: any = {};

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadPatientStats();
  }

  loadPatientStats(): void {
    this.http.get<any[]>(`${environment.apiUrl}/ecg/patient/${this.currentUser.id}`).subscribe(records => {
      this.stats.totalUploads = records.length;
      if (records.length > 0) {
        const sorted = records.sort((a, b) => new Date(b.uploadTimestamp).getTime() - new Date(a.uploadTimestamp).getTime());
        this.stats.lastUpload = sorted[0].uploadTimestamp;
      }
    });
  }

  getUserInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatGender(gender: string): string {
    return gender?.charAt(0).toUpperCase() + gender?.slice(1);
  }

  formatDate(date: string, format: string = 'full'): string {
    return new Date(date).toLocaleDateString();
  }
}
