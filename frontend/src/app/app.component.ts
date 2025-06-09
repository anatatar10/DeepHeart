import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {HeaderComponent} from './ecg/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(public router: Router) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    if (user) {
      const { role } = JSON.parse(user);
      document.body.setAttribute('data-user-role', role.toLowerCase());
    }
  }
  get isAuthRoute(): boolean {
    return this.router.url.startsWith('/auth');
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }
}
