import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    console.log('AuthService initialized with apiUrl:', this.apiUrl);
  }

  // Login method with proper typing and debugging
  login(credentials: any): Observable<any> {
    const loginUrl = `${this.apiUrl}/users/signin`;

    console.log('=== LOGIN DEBUG INFO ===');
    console.log('API URL:', this.apiUrl);
    console.log('Full login URL:', loginUrl);
    console.log('Credentials being sent:', credentials);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(loginUrl, credentials, { headers }).pipe(
      tap((response: any) => {
        console.log('Login response received:', response);
        if (response.user) {
          localStorage.setItem('auth_user', JSON.stringify(response.user));
          localStorage.setItem('auth_token', response.token);
          console.log('Saved user to localStorage:', response.user);
        }
      }),
      catchError((error) => {
        console.error('=== LOGIN ERROR ===');
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error);
        console.error('Request URL that failed:', loginUrl);
        return throwError(error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    this.router.navigate(['/auth']);
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setUser(user: any): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
    console.log('Saved user to localStorage:', JSON.stringify(user));
  }

  getUser(): any {
    const userStr = localStorage.getItem('auth_user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('auth_user');
      return null;
    }
  }

  isAuthenticated(): boolean {
    const hasToken = !!this.getToken();
    const hasUser = !!this.getUser();
    console.log('Authentication check - hasToken:', hasToken, 'hasUser:', hasUser);
    return hasToken && hasUser;
  }
}
