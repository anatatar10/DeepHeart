import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
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
        return throwError(error);
      })
    );
  }

  // Forgot Password - Send reset email
  forgotPassword(email: string): Observable<any> {
    const forgotPasswordUrl = `${this.apiUrl}/users/forgot-password`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const payload = { email };

    console.log('Forgot password request details:');
    console.log('URL:', forgotPasswordUrl);
    console.log('Payload:', payload);
    console.log('Headers:', headers);

    return this.http.post(forgotPasswordUrl, payload, { headers }).pipe(
      tap((response: any) => {
        console.log('Forgot password response:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Forgot password error details:');
        console.error('Status:', error.status);
        console.error('Status Text:', error.statusText);
        console.error('URL:', error.url);
        console.error('Error Body:', error.error);
        console.error('Full Error Object:', error);

        let errorMessage = 'Failed to send reset email. Please try again.';

        if (error.status === 403) {
          errorMessage = 'Access denied. Please check if the email exists or contact support.';
        } else if (error.status === 404) {
          errorMessage = 'Email address not found.';
        } else if (error.status === 429) {
          errorMessage = 'Too many requests. Please wait before trying again.';
        } else if (error.status === 0) {
          errorMessage = 'Unable to connect to server. Please check your connection.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        return throwError({ ...error, userMessage: errorMessage });
      })
    );


  }

  updateProfile(updatedUser: any): Observable<any> {
    const updateProfileUrl = `${this.apiUrl}/users/update-profile`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });

    // Build safe payload to send only allowed fields:
    const payload = {
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      gender: updatedUser.gender,
      birthdate: updatedUser.birthdate,
      smokingStatus: updatedUser.smokingStatus,
      bloodPressure: updatedUser.bloodPressure,
      medicalHistory: updatedUser.medicalHistory
    };

    return this.http.put(updateProfileUrl, payload, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Profile updated successfully:', response);
        if (response) {
          this.setUser(response);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Profile update failed:', error);
        return throwError(error);
      })
    );
  }



  // Reset Password - Reset with token
  resetPassword(token: string, newPassword: string): Observable<any> {
    const resetPasswordUrl = `${this.apiUrl}/users/reset-password`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const payload = {
      token,
      newPassword,
      confirmPassword: newPassword
    };

    console.log('Reset password request details:');
    console.log('URL:', resetPasswordUrl);
    console.log('Payload:', { ...payload, newPassword: '***', confirmPassword: '***' });

    return this.http.post(resetPasswordUrl, payload, { headers }).pipe(
      tap((response: any) => {
        console.log('Reset password response:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Reset password error:', error);

        let errorMessage = 'Failed to reset password. Please try again.';

        if (error.status === 403) {
          errorMessage = 'Invalid or expired reset token.';
        } else if (error.status === 404) {
          errorMessage = 'Reset token not found.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        return throwError({ ...error, userMessage: errorMessage });
      })
    );
  }

  // Verify Reset Token
  verifyResetToken(token: string): Observable<any> {
    const verifyTokenUrl = `${this.apiUrl}/users/verify-reset-token`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const payload = { token };

    console.log('Verify token request details:');
    console.log('URL:', verifyTokenUrl);
    console.log('Payload:', payload);

    return this.http.post(verifyTokenUrl, payload, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Verify token response:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Verify token error:', error);

        let errorMessage = 'Invalid or expired reset token.';

        if (error.error?.message) {
          errorMessage = error.error.message;
        }

        return throwError({ ...error, userMessage: errorMessage });
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

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Get current user (alias for getUser)
   * Consistent naming across the application
   */
  getCurrentUser(): any {
    return this.getUser();
  }

  /**
   * Check if current user has admin role
   */
  isAdmin(): boolean {
    const user = this.getUser();
    return user && user.role === 'ADMIN';
  }

  /**
   * Check if current user has doctor role
   */
  isDoctor(): boolean {
    const user = this.getUser();
    return user && user.role === 'DOCTOR';
  }




  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }


  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }


  isPatient(): boolean {
    const user = this.getUser();
    return user && user.role === 'PATIENT';
  }


  getUserRole(): string | null {
    const user = this.getUser();
    return user ? user.role : null;
  }

  /**
   * Navigate to appropriate dashboard after login
   */
  navigateAfterLogin(router: any): void {
    const user = this.getUser();
    console.log('🚀 AuthService: Navigate after login - User:', user);

    if (!user) {
      console.log('❌ No user found, redirecting to auth');
      router.navigate(['/auth']);
      return;
    }

    const role = user.role?.toUpperCase();
    console.log('🎭 User role for navigation:', role);

    switch (role) {
      case 'ADMIN':
        console.log('🔴 AuthService: Navigating to admin dashboard');
        router.navigate(['/dashboard-admin']);
        break;
      case 'DOCTOR':
        console.log('🟢 AuthService: Navigating to doctor dashboard');
        router.navigate(['/dashboard-doctor']);
        break;
      case 'PATIENT':
        console.log('🔵 AuthService: Navigating to patient dashboard');
        router.navigate(['/dashboard-patient']);
        break;
      default:
        console.log('⚠️ AuthService: Unknown role, defaulting to patient dashboard');
        router.navigate(['/dashboard-patient']);
    }
  }

  /**
   * Debug current user status
   */
  debugUserStatus(): void {
    const token = this.getToken();
    const user = this.getUser();

    console.log('🔍 === AUTH DEBUG STATUS ===');
    console.log('🔑 Token exists:', !!token);
    console.log('👤 User exists:', !!user);
    console.log('📋 User data:', user);
    console.log('🎭 User role:', user?.role);
    console.log('✅ Is authenticated:', this.isAuthenticated());
    console.log('🔴 Is admin:', this.isAdmin());
    console.log('🟢 Is doctor:', this.isDoctor());
    console.log('🔵 Is patient:', this.isPatient());
    console.log('========================');
  }
}
