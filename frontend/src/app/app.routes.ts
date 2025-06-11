import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: 'auth', loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent) },
  { path: 'dashboard-doctor', loadComponent: () => import('./dashboard-doctor/dashboard-doctor.component').then(m => m.DashboardDoctorComponent) },
  { path: 'dashboard-patient', loadComponent: () => import('./dashboard-patient/dashboard-patient.component').then(m => m.DashboardPatientComponent) },
  { path: 'analytics', loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent) },
  { path: 'upload', loadComponent: () => import('./components/ecg-upload/ecg-upload.component').then(m => m.EcgUploadComponent) },
  { path: 'patients', loadComponent: () => import('./components/patients/patients.component').then(m => m.PatientsComponent) },
  { path: 'patient-records/:id', loadComponent: () => import('./components/patient-records/patient-records.component').then(m => m.PatientRecordsComponent) },
  { path: '**', redirectTo: '/auth' }
];
