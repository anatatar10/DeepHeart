// auth.component.ts - Fixed version
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  signupForm: FormGroup;
  signinForm: FormGroup;
  isSignUpMode = false;
  loading = false;
  signinBgImage = '/assets/images/signin-bg.png';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService,
    private router: Router,
    private authService: AuthService
  ) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      role: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^\\d{10}$')]],
      birthdate: ['', Validators.required],
      gender: ['', Validators.required]
    }, { validators: this.passwordsMatch });

    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  toggleForm() {
    this.isSignUpMode = !this.isSignUpMode;
    this.signupForm.reset();
    this.signinForm.reset();
  }

  // Custom validator to check if passwords match
  passwordsMatch(group: FormGroup): { [key: string]: any } | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  // Getter to check if all signup fields are valid
  get isSignupFormValid(): boolean {
    return this.signupForm.valid &&
      this.signupForm.get('password')?.value === this.signupForm.get('confirmPassword')?.value;
  }

  // Getter to check if all signin fields are valid
  get isSigninFormValid(): boolean {
    return this.signinForm.valid;
  }

  // Check if a specific field is invalid and touched
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Get error message for a field
  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) return 'Please enter a valid phone number (10 digits)';
    }
    if (fieldName === 'confirmPassword' && this.signupForm.errors?.['mismatch']) {
      return 'Passwords do not match';
    }
    return '';
  }

  // Navigate to forgot password page
  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill out all required fields correctly.'
      });
      return;
    }

    this.loading = true;
    this.http.post(`${environment.apiUrl}/users/signup`, this.signupForm.value).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Signup Success',
          detail: 'Account created successfully!'
        });
        this.signupForm.reset();
        this.isSignUpMode = false;
        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message || 'Signup failed. Try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Signup Failed',
          detail: msg
        });
        this.loading = false;
      }
    });
  }

  // Calculate form completion percentage
  getFormCompletionPercentage(): number {
    const totalFields = Object.keys(this.signupForm.controls).length;
    let validFields = 0;

    Object.keys(this.signupForm.controls).forEach(key => {
      const field = this.signupForm.get(key);
      if (field && field.valid && field.value) {
        validFields++;
      }
    });

    // Also check password match
    if (this.signupForm.errors?.['mismatch']) {
      validFields = Math.max(0, validFields - 1);
    }

    return Math.round((validFields / totalFields) * 100);
  }

  onSignIn() {
    if (this.signinForm.invalid) {
      Object.keys(this.signinForm.controls).forEach(key => {
        this.signinForm.get(key)?.markAsTouched();
      });
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter email and password.'
      });
      return;
    }

    this.loading = true;
    this.http.post(`${environment.apiUrl}/users/signin`, this.signinForm.value).subscribe({
      next: (res: any) => {
        console.log('Login response:', res); // Debug line

        this.messageService.add({
          severity: 'success',
          summary: 'Login Success',
          detail: 'Welcome!'
        });

        // Set token and user data
        this.authService.setToken(res.token);
        this.authService.setUser(res.user);

        console.log('User data saved:', res.user); // Debug line
        console.log('User role:', res.user?.role); // Debug line

        // Navigate based on user role (check res.user.role, not res.role)
        if (res.user?.role === 'DOCTOR' || res.user?.role === 'doctor') {
          this.router.navigate(['/dashboard-doctor']);
        } else if (res.user?.role === 'PATIENT' || res.user?.role === 'patient') {
          this.router.navigate(['/dashboard-patient']);
        } else {
          // Fallback navigation
          this.router.navigate(['/dashboard-doctor']); // or wherever you want to send them
        }

        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message || 'Sign in failed. Try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: msg
        });
        this.loading = false;
      }
    });
  }
}
