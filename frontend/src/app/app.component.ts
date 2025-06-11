import { Component } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './ecg/components/header/header.component';

import { ToastModule } from 'primeng/toast';  // <-- import ToastModule here

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, ToastModule],  // <-- add here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  isAuthRoute = false;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        console.log('🔍 Current URL:', this.router.url);
        this.isAuthRoute = this.router.url.includes('/auth');
        console.log('🔍 Is auth route (navbar hidden):', this.isAuthRoute);
        console.log('🔍 Should show navbar:', !this.isAuthRoute);
      }
    });
  }
}
