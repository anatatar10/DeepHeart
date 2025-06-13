

import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserDTO, UserService, CreateUserRequest, UpdateUserRequest } from '../../services/user.service';

@Component({
  selector: 'app-user-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-edit-modal.component.html',
  styleUrls: ['./user-edit-modal.component.scss']
})
export class UserEditModalComponent {
  isVisible = false;
  isEditMode = false;
  currentUser: UserDTO | null = null;
  form: FormGroup;
  isSubmitting = false;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phone: [''],
      gender: [''],
      birthdate: [''],
      role: ['', Validators.required],
    });
  }

  openCreate() {
    this.isEditMode = false;
    this.currentUser = null;
    this.form.reset();
    this.isVisible = true;
  }

  openEdit(user: UserDTO) {
    this.isEditMode = true;
    this.currentUser = user;
    this.form.patchValue({
      ...user,
      password: ''
    });
    this.form.get('password')?.clearValidators();
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
  }

  submit() {
    if (this.form.invalid) return;
    this.isSubmitting = true;

    if (this.isEditMode && this.currentUser) {
      const updateData: UpdateUserRequest = { ...this.form.value };
      delete (updateData as any).password;

      this.userService.updateUser(this.currentUser.id, updateData).subscribe({
        next: () => {
          this.close();
          this.isSubmitting = false;
        },
        error: () => this.isSubmitting = false
      });

    } else {
      this.userService.createUser(this.form.value as CreateUserRequest).subscribe({
        next: () => {
          this.close();
          this.isSubmitting = false;
        },
        error: () => this.isSubmitting = false
      });
    }
  }
}
