// forgot-password.component.ts - Updated with better error handling
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  resetPasswordForm: FormGroup;
  loading = false;
  isResetMode = false;
  emailSent = false;
  token: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Initialize forms
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatch });

    // Check if we have a reset token in the URL
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
        this.verifyToken();
      }
    });
  }

  // Custom validator to check if passwords match
  passwordsMatch(group: FormGroup): { [key: string]: any } | null {
    const pass = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  // Verify if the reset token is valid
  verifyToken() {
    if (!this.token) return;

    this.loading = true;
    this.authService.verifyResetToken(this.token).subscribe({
      next: (response) => {
        this.isResetMode = true;
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Token Valid',
          detail: 'Please enter your new password.'
        });
      },
      error: (error) => {
        this.loading = false;
        const message = error.userMessage || error.error?.message || 'Invalid or expired reset token.';
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid Token',
          detail: message
        });
        // Redirect back to forgot password form
        this.router.navigate(['/forgot-password']);
      }
    });
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
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `Password must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (fieldName === 'confirmPassword' && this.resetPasswordForm.errors?.['mismatch']) {
      return 'Passwords do not match';
    }
    return '';
  }

  // Send forgot password email
  onForgotPassword() {
    if (this.forgotPasswordForm.invalid) {
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const email = this.forgotPasswordForm.get('email')?.value;

    console.log('📧 Attempting to send forgot password email to:', email);

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.emailSent = true;
        this.loading = false;
        console.log('✅ Forgot password email sent successfully');
        this.messageService.add({
          severity: 'success',
          summary: 'Email Sent',
          detail: 'Password reset instructions have been sent to your email.'
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Failed to send forgot password email:', error);

        // Use the enhanced error message from the service
        const message = error.userMessage || error.error?.message || 'Failed to send reset email. Please try again.';

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: message
        });
      }
    });
  }

  // Reset password with new password
  onResetPassword() {
    if (this.resetPasswordForm.invalid || !this.token) {
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        this.resetPasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const newPassword = this.resetPasswordForm.get('newPassword')?.value;

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: (response) => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Password Reset',
          detail: 'Your password has been successfully reset.'
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/auth']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        const message = error.userMessage || error.error?.message || 'Failed to reset password. Please try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: message
        });
      }
    });
  }

  // Navigate back to login
  goBackToLogin() {
    this.router.navigate(['/auth']);
  }

  // Resend email
  resendEmail() {
    this.emailSent = false;
    this.onForgotPassword();
  }
}
