import { Routes } from '@angular/router';
import { UploadComponent } from './ecg/pages/upload/upload.component';
import { PatientsComponent } from './ecg/pages/patients/patients.component';
import { AnalyticsComponent } from './ecg/pages/analytics/analytics.component';
import { DashboardComponent } from './ecg/pages/dashboard/dashboard.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' }, // 👈 default route
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'upload', component: UploadComponent, canActivate: [AuthGuard] },
  { path: 'patients', component: PatientsComponent, canActivate: [AuthGuard] },
  { path: 'analytics', component: AnalyticsComponent, canActivate: [AuthGuard] }
];
