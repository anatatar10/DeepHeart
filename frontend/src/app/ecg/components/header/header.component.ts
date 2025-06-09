import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api'; // ✅

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [MessageService], // ✅ provide it here
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  get currentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  logout() {
    localStorage.removeItem('user');
    window.location.href = '/auth';
  }
}
