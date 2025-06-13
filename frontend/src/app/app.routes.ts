import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { RoleGuard } from './guards/roleguard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },

  { path: 'auth', loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent) },
  { path: 'forgot-password', loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },

  // Doctor
  {
    path: 'dashboard-doctor',
    loadComponent: () => import('./dashboard-doctor/dashboard-doctor.component').then(m => m.DashboardDoctorComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['DOCTOR'] },
    title: 'Doctor Dashboard'
  },

  // Patient
  {
    path: 'dashboard-patient',
    loadComponent: () => import('./dashboard-patient/dashboard-patient.component').then(m => m.DashboardPatientComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['PATIENT'] },
    title: 'Patient Dashboard'
  },

  // Admin
  {
    path: 'dashboard-admin',
    loadComponent: () => import('./dashboard-admin/dashboard-admin.component').then(m => m.DashboardAdminComponent),
    canActivate: [AuthGuard, AdminGuard],
    title: 'Admin Dashboard'
  },

  // Shared (only DOCTOR & PATIENT)
  {
    path: 'analytics',
    loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['DOCTOR'] },
    title: 'Analytics'
  },
  {
    path: 'upload',
    loadComponent: () => import('./components/ecg-upload/ecg-upload.component').then(m => m.EcgUploadComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['DOCTOR', 'PATIENT'] },
    title: 'Upload ECG'
  },
  {
    path: 'patients',
    loadComponent: () => import('./components/patients/patients.component').then(m => m.PatientsComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['DOCTOR'] },
    title: 'Patients'
  },
  {
    path: 'patient-records/:id',
    loadComponent: () => import('./components/patient-records/patient-records.component').then(m => m.PatientRecordsComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['DOCTOR'] },
    title: 'Patient Records'
  },

  // 🆕 ECG History (patient only)
  {
    path: 'ecg-history',
    loadComponent: () => import('./components/ecg-history/ecg-history.component').then(m => m.EcgHistoryComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['PATIENT'] },
    title: 'ECG History'
  },

  { path: '**', redirectTo: '/auth' }
];
