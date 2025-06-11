import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user'; // adjust path if needed

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
// In header.component.ts
export class HeaderComponent {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {
    this.currentUser = this.authService.getUser();
    console.log('Header - Current user:', this.currentUser); // Debug line
  }

  // In header.component.ts
  logout(): void {
    this.authService.logout(); // This will now work
  }

  formatRole(role: string): string {
    return role?.charAt(0).toUpperCase() + role?.slice(1).toLowerCase();
  }

  getRoleStatusClass(role: string): string {
    switch (role?.toUpperCase()) {
      case 'DOCTOR':
        return 'status-doctor';
      case 'PATIENT':
        return 'status-patient';
      case 'ADMIN':
        return 'status-admin';
      default:
        return 'status-guest';
    }
  }
}
