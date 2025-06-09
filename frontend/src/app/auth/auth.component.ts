import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      name: ['', Validators.required],
      role: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^\\d{10}$')]],
      birthdate: [''],
      gender: ['']
    });

    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  toggleForm() {
    this.isSignUpMode = !this.isSignUpMode;
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill out all required fields' });
      return;
    }

    this.http.post('http://localhost:8080/api/users/signup', this.signupForm.value).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Signup Success', detail: 'Account created successfully!' });
        this.signupForm.reset();
        this.isSignUpMode = false; // Switch to login
      },
      error: (err) => {
        const msg = err.error?.message || 'Signup failed. Try again.';
        this.messageService.add({ severity: 'error', summary: 'Signup Failed', detail: msg });
      }
    });
  }

  onSignIn() {
    if (this.signinForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please enter email and password' });
      return;
    }

    this.http.post('http://localhost:8080/api/users/signin', this.signinForm.value).subscribe({
      next: (res: any) => {
        this.messageService.add({ severity: 'success', summary: 'Login Success', detail: 'Welcome!' });
        localStorage.setItem('user', JSON.stringify(res));
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Sign in failed. Try again.';
        this.messageService.add({ severity: 'error', summary: 'Login Failed', detail: msg });
      }
    });
  }
}
