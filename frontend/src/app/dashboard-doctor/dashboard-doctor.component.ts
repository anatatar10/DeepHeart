import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DashboardService, DashboardStats } from '../services/dashboard.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-dashboard-doctor',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard-doctor.component.html',
  styleUrls: ['./dashboard-doctor.component.scss']
})
export class DashboardDoctorComponent implements OnInit {
  currentUser: any = null;
  stats: DashboardStats | null = null;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.fetchStats();
  }

  private loadCurrentUser(): void {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.logout();
      }
    }
  }

  private fetchStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = {
          ...data,
          modelAccuracy: data.modelAccuracy ?? 0 // Default to 0 if undefined
        };
      },
      error: (err) => {
        console.error('Failed to fetch dashboard stats', err);
      }
    });
  }

  getRoleStatusClass(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin': return 'status--error';
      case 'clinician':
      case 'doctor': return 'status--success';
      case 'patient': return 'status--info';
      default: return 'status--info';
    }
  }

  formatRole(role: string): string {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
