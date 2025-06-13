// src/app/dashboard-admin/dashboard-admin.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { DashboardService, DashboardStats } from '../services/dashboard.service';
import { UserService, UserDTO, CreateUserRequest, UpdateUserRequest } from '../services/user.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss']
})
export class DashboardAdminComponent implements OnInit {
  currentUser: any = null;
  stats: DashboardStats | null = null;

  users: UserDTO[] = [];
  filteredUsers: UserDTO[] = [];
  isLoading = false;

  searchTerm = '';
  selectedRole = '';

  activeTab = 'overview';
  tabs = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-pie' },
    { id: 'users', label: 'User Management', icon: 'fas fa-users-cog' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-chart-bar' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
  ];

  selectedUser: UserDTO | null = null;
  currentEditUser: UserDTO | null = null;

  userForm: FormGroup;
  showUserModal = false;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      gender: [''],
      birthdate: [''],
      role: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadUsers();
  }

  loadCurrentUser() {
    this.currentUser = this.authService.getUser();
  }

  loadUsers() {
    this.isLoading = true;
    this.userService.loadUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get userStats() {
    return this.userService.getUserStats();
  }

  get recentUsers(): UserDTO[] {
    return this.users
      .sort((a, b) => new Date(b.registrationDate || '').getTime() - new Date(a.registrationDate || '').getTime())
      .slice(0, 5);
  }

  filterUsers() {
    this.filteredUsers = this.userService.searchUsers(this.searchTerm, this.selectedRole);
  }

  viewUserDetails(user: UserDTO): void {
    this.selectedUser = user;
  }

  closeUserDetails(): void {
    this.selectedUser = null;
  }

  editUser(user: UserDTO): void {
    this.currentEditUser = user;
    this.userForm.patchValue({
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      birthdate: user.birthdate,
      role: user.role
    });
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.currentEditUser = null;
  }

  submitUser(): void {
    if (!this.userForm.valid || !this.currentEditUser) return;

    const updateData: UpdateUserRequest = this.userForm.value;

    this.userService.updateUser(this.currentEditUser.id, updateData).subscribe({
      next: (updatedUser) => {
        const idx = this.users.findIndex(u => u.id === updatedUser.id);
        if (idx !== -1) this.users[idx] = updatedUser;
        this.filteredUsers = [...this.users];
        this.closeUserModal();
      },
      error: (err) => console.error('Update failed', err)
    });
  }

  deleteUser(user: UserDTO): void {
    if (confirm(`Are you sure you want to delete user ${user.name}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.filteredUsers = [...this.users];
        },
        error: (err) => console.error('Delete failed', err)
      });
    }
  }
}
