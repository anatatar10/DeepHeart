// edit-profile.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit {
  @Input() isVisible = false;
  @Input() currentUser: any = null;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() updateEvent = new EventEmitter<any>();

  profileForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.currentUser) {
      this.populateForm();
    }
  }

  ngOnChanges(): void {
    if (this.currentUser && this.profileForm) {
      this.populateForm();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      gender: [''],
      birthdate: [''],
      smokingStatus: [''],
      bloodPressure: [''],
      medicalHistoryString: ['']
    });
  }

  private populateForm(): void {
    if (!this.currentUser) return;

    this.profileForm.patchValue({
      name: this.currentUser.name || '',
      username: this.currentUser.username || '',
      email: this.currentUser.email || '',
      phone: this.currentUser.phone || '',
      gender: this.currentUser.gender || '',
      birthdate: this.formatDateForInput(this.currentUser.birthdate),
      smokingStatus: this.currentUser.smokingStatus || '',
      bloodPressure: this.currentUser.bloodPressure || '',
      medicalHistoryString: this.currentUser.medicalHistory?.join(', ') || ''
    });
  }

  private formatDateForInput(date: string | Date | undefined): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';

    // Format as YYYY-MM-DD for input[type="date"]
    return dateObj.toISOString().split('T')[0];
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isPatientRole(): boolean {
    return this.currentUser?.role?.toLowerCase() === 'patient';
  }

  onSubmit(): void {
    if (this.profileForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.profileForm.value;

      // Convert medical history string back to array
      const medicalHistory = formValue.medicalHistoryString
        ? formValue.medicalHistoryString.split(',').map((condition: string) => condition.trim()).filter((condition: string) => condition)
        : [];

      const updatedUser = {
        ...this.currentUser,
        ...formValue,
        medicalHistory,
        // Remove the string version
        medicalHistoryString: undefined
      };

      // Convert birthdate to proper format if provided
      if (updatedUser.birthdate) {
        updatedUser.birthdate = new Date(updatedUser.birthdate).toISOString().split('T')[0];
      }

      // Remove undefined/empty properties
      Object.keys(updatedUser).forEach(key => {
        if (updatedUser[key] === undefined || updatedUser[key] === '') {
          delete updatedUser[key];
        }
      });

      // Simulate API call - replace with actual service call
      setTimeout(() => {
        this.isSubmitting = false;
        this.updateEvent.emit(updatedUser);
        this.closeModal();
      }, 1000);

      // Uncomment this when your AuthService has updateProfile method:
      /*
      this.authService.updateProfile(updatedUser).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.updateEvent.emit(response);
          this.closeModal();
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Profile update failed:', error);
        }
      });
      */
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
    }
  }

  closeModal(): void {
    this.isVisible = false;
    this.closeEvent.emit();
    this.profileForm.reset();
    this.populateForm(); // Reset to original values
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
