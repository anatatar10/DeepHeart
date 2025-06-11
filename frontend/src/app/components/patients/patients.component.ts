// src/app/components/patients/patients.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';
import { Patient} from '../../models/patient';
import { CreatePatientRequest } from '../../models/patientrequest';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.scss']
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = [];
  loading = false;
  showAddModal = false;
  editingPatient: Patient | null = null;
  searchTerm = '';
  today: string = new Date().toISOString().split('T')[0];

  newPatient: CreatePatientRequest = {
    name: '',
    email: '',
    phone: '',
    birthdate: '',
    gender: '',
    age: null,
    bloodPressure: '',
    smokingStatus: ''
  };

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router
  ) {
    console.log('PatientsComponent initialized');
    console.log('User authenticated:', this.authService.isAuthenticated());
    console.log('Current user:', this.authService.getUser());
  }

  ngOnInit(): void {
    this.checkAuthentication();
    this.testBackendConnection();
    this.loadPatients();
  }

  checkAuthentication(): void {
    if (!this.authService.isAuthenticated()) {
      console.warn('⚠️ User not authenticated, but patients endpoint allows public access');
    }
  }

  testBackendConnection(): void {
    console.log('🔍 Testing backend connection...');
    this.patientService.testConnection().subscribe({
      next: (response) => {
        console.log('✅ Backend connection successful:', response);
      },
      error: (error) => {
        console.error('❌ Backend connection failed:', error);
        this.showNotification('Backend connection failed. Please ensure the server is running on port 8080.', 'error');
      }
    });
  }

  loadPatients(): void {
    this.loading = true;
    console.log('🔍 Loading patients...');

    const currentUser = this.authService.getUser();
    let patientsObservable;

    if (currentUser && currentUser.role === 'DOCTOR') {
      console.log('👨‍⚕️ Loading patients for doctor:', currentUser.name);
      patientsObservable = this.patientService.getPatientsByDoctor(currentUser.id);
    } else {
      console.log('👑 Loading all patients (admin view)');
      patientsObservable = this.patientService.getAllPatients();
    }

    patientsObservable.subscribe({
      next: (patients) => {
        console.log('✅ Patients loaded successfully:', patients);
        this.patients = patients;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading patients:', error);
        this.loading = false;

        if (error.message.includes('Network error') || error.message.includes('Connection refused')) {
          this.showNotification('❌ Backend server is not running. Please start the Spring Boot application on port 8080.', 'error');
        } else if (error.message.includes('Unauthorized')) {
          this.showNotification('🔐 Please login to access patient data.', 'error');
        } else {
          this.showNotification(`Error: ${error.message}`, 'error');
        }
      }
    });
  }

  searchPatients(): void {
    if (this.searchTerm.trim()) {
      this.loading = true;
      const currentUser = this.authService.getUser();

      this.patientService.searchPatients(this.searchTerm).subscribe({
        next: (patients) => {
          if (currentUser && currentUser.role === 'DOCTOR') {
            this.patients = patients.filter(patient => patient.doctorId === currentUser.id);
            console.log(`🔍 Filtered search results for Dr. ${currentUser.name}:`, this.patients);
          } else {
            this.patients = patients;
            console.log('🔍 Search results (all patients):', this.patients);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error searching patients:', error);
          this.loading = false;
        }
      });
    } else {
      this.loadPatients();
    }
  }

  openAddModal(): void {
    this.showAddModal = true;
    this.resetForm();
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.editingPatient = null;
    this.resetForm();
  }

  resetForm(): void {
    this.newPatient = {
      name: '',
      email: '',
      phone: '',
      birthdate: '',
      gender: '',
      age: null,
      bloodPressure: '',
      smokingStatus: ''
    };
  }

  addPatient(): void {
    console.log('Adding patient with data:', this.newPatient);

    if (this.validateForm()) {
      const currentUser = this.authService.getUser();

      if (currentUser && currentUser.role === 'DOCTOR') {
        this.newPatient.doctorId = currentUser.id;
      }

      this.patientService.createPatient(this.newPatient).subscribe({
        next: (patient) => {
          console.log('Patient created successfully:', patient);
          this.patients.push(patient);
          this.closeAddModal();
          this.showNotification('Patient added successfully', 'success');
        },
        error: (error) => {
          console.error('Error adding patient:', error);
          console.error('Error details:', error.error);
          this.showNotification('Error adding patient', 'error');
        }
      });
    }
  }

  editPatient(patient: Patient): void {
    this.editingPatient = patient;
    this.newPatient = {
      name: patient.name,
      email: patient.email,
      phone: patient.phone || '',
      birthdate: patient.birthdate || '',
      gender: patient.gender || '',
      age: patient.age || null,
      bloodPressure: patient.bloodPressure || '',
      smokingStatus: patient.smokingStatus || ''
    };
    this.showAddModal = true;
  }

  updatePatient(): void {
    console.log('Updating patient with data:', this.newPatient);

    if (this.editingPatient && this.validateForm()) {
      // Convert ID to string if your service expects string
      const patientId = this.editingPatient.id!.toString();

      this.patientService.updatePatient(patientId, this.newPatient).subscribe({
        next: (updatedPatient) => {
          console.log('Patient updated successfully:', updatedPatient);
          const index = this.patients.findIndex(p => p.id === this.editingPatient!.id);
          if (index !== -1) {
            this.patients[index] = updatedPatient;
          }
          this.closeAddModal();
          this.showNotification('Patient updated successfully', 'success');
        },
        error: (error) => {
          console.error('Error updating patient:', error);
          console.error('Error details:', error.error);
          this.showNotification('Error updating patient', 'error');
        }
      });
    }
  }

  deletePatient(patient: Patient): void {
    if (confirm(`Are you sure you want to delete ${patient.name}?`)) {
      // Convert ID to string if your service expects string
      const patientId = patient.id!.toString();

      this.patientService.deletePatient(patientId).subscribe({
        next: () => {
          this.patients = this.patients.filter(p => p.id !== patient.id);
          this.showNotification('Patient deleted successfully', 'success');
        },
        error: (error) => {
          console.error('Error deleting patient:', error);
          this.showNotification('Error deleting patient', 'error');
        }
      });
    }
  }

  viewPatientRecords(patient: Patient): void {
    console.log('Navigating to patient records for:', patient.name);
    this.router.navigate(['/patient-records', patient.id]);
  }

  validateForm(): boolean {
    const isValid = !!(
      this.newPatient.name &&
      this.newPatient.email &&
      this.newPatient.phone &&
      this.newPatient.birthdate &&
      this.newPatient.gender &&
      this.newPatient.age !== null && this.newPatient.age >= 0 &&
      this.newPatient.bloodPressure &&
      this.newPatient.smokingStatus
    );

    if (!isValid) {
      console.log('Form validation failed. Current form data:', this.newPatient);
    }

    return isValid;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private showNotification(message: string, type: string): void {
    console.log(`${type.toUpperCase()}: ${message}`);

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background: ${type === 'error' ? '#dc2626' : '#059669'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      max-width: 400px;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
      if (style.parentNode) {
        style.remove();
      }
    }, 5000);
  }

  calculateAge(birthdate: string | null | undefined): number | null {
    if (!birthdate) {
      this.newPatient.age = null;
      return null;
    }

    const birth = new Date(birthdate);
    const today = new Date();

    // Normalize time to midnight to avoid timezone issues
    birth.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (birth >= today) {
      this.newPatient.age = null;
      return null; // Invalid: birthdate is today or in the future
    }

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    this.newPatient.age = age;
    return age;
  }

  getCurrentUserRole(): string | null {
    const user = this.authService.getUser();
    return user ? user.role : null;
  }

  getCurrentUserName(): string | null {
    const user = this.authService.getUser();
    return user ? user.name : null;
  }
}
