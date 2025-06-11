// dashboard-doctor.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DashboardService, DashboardStats } from '../services/dashboard.service';
import { HttpClientModule } from '@angular/common/http';
import { EditProfileComponent } from '../components/edit-profile/edit-profile.component';

@Component({
  selector: 'app-dashboard-doctor',
  standalone: true,
  imports: [CommonModule, HttpClientModule, EditProfileComponent],
  templateUrl: './dashboard-doctor.component.html',
  styleUrls: ['./dashboard-doctor.component.scss']
})
export class DashboardDoctorComponent implements OnInit {
  currentUser: any = null;
  stats: DashboardStats | null = null;
  showEditModal = false;

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
          modelAccuracy: data.modelAccuracy ?? 94.2 // Default to 94.2 if undefined
        };
      },
      error: (err) => {
        console.error('Failed to fetch dashboard stats', err);
        // Set default stats on error
        this.stats = {
          totalUploads: 0,
          totalPatients: 0,
          todaysUploads: 0,
          modelAccuracy: 94.2
        };
      }
    });
  }

  // Existing methods
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

  // New methods for enhanced functionality

  /**
   * Get user initials for avatar display
   */
  getUserInitials(name?: string): string {
    if (!name) return 'U';

    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return words.slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  /**
   * Format gender for display
   */
  formatGender(gender: string): string {
    if (!gender) return '';
    return this.capitalizeFirst(gender);
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date | undefined, format: 'full' | 'month' = 'full'): string {
    if (!date) return 'Not available';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'Invalid date';

    switch (format) {
      case 'month':
        return dateObj.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric'
        });
      case 'full':
      default:
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
    }
  }

  /**
   * Format medical history for display
   */
  formatMedicalHistory(history: string[]): string {
    if (!history || history.length === 0) return 'No known conditions';
    if (history.length === 1) return history[0];
    if (history.length <= 3) return history.join(', ');
    return `${history.slice(0, 2).join(', ')} and ${history.length - 2} more`;
  }

  /**
   * Check if current user is a patient
   */
  isPatient(): boolean {
    return this.currentUser?.role?.toLowerCase() === 'patient';
  }

  /**
   * Check if current user is a doctor or admin
   */
  isDoctor(): boolean {
    return this.currentUser?.role?.toLowerCase() === 'doctor' ||
      this.currentUser?.role?.toLowerCase() === 'admin';
  }

  /**
   * Get role-specific CSS class
   */
  getRoleClass(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'role-admin';
      case 'doctor':
        return 'role-doctor';
      case 'patient':
        return 'role-patient';
      default:
        return 'role-default';
    }
  }

  /**
   * Handle edit profile button click
   */
  onEditProfile(): void {
    this.showEditModal = true;
  }

  /**
   * Handle settings button click
   */
  onSettings(): void {
    // Navigate to settings or show settings modal
    console.log('Settings clicked - implement navigation or modal');
    // Example: this.router.navigate(['/settings']);
  }

  /**
   * Close edit profile modal
   */
  closeEditModal(): void {
    this.showEditModal = false;
  }

  /**
   * Handle profile update from edit modal
   */
  onProfileUpdated(updatedUser: any): void {
    this.currentUser = updatedUser;
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    this.showEditModal = false;

    // Show success message
    this.showNotification('Profile updated successfully!', 'success');
  }

  /**
   * Show notification message
   */
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Simple notification - you can replace with a proper notification service
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 6px;
      color: white;
      background-color: ${this.getNotificationColor(type)};
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideInRight 0.3s ease-out;
    `;

    // Add animation keyframes if not already present
    if (!document.querySelector('#notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  /**
   * Get notification color based on type
   */
  private getNotificationColor(type: string): string {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirst(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Refresh dashboard stats
   */
  refreshStats(): void {
    this.fetchStats();
  }

  /**
   * Get formatted account age
   */
  getAccountAge(): string {
    if (!this.currentUser?.registrationDate) return 'Recently joined';

    const created = new Date(this.currentUser.registrationDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  /**
   * Get user status for display
   */
  getUserStatus(): string {
    // You can implement logic to determine user status
    // For now, assume online if recently active
    return 'online';
  }

  /**
   * Handle avatar click (could open profile or upload image)
   */
  onAvatarClick(): void {
    console.log('Avatar clicked - implement image upload or profile view');
  }
}
