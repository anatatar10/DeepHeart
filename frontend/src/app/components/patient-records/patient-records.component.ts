// src/app/components/patient-records/patient-records.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';
import { Patient } from '../../models/patient';

interface MedicalRecord {
  id?: number;
  patientId: number;
  date: string;
  diagnosis: string;
  treatment: string;
  medications: string;
  notes: string;
  doctorName: string;
  visitType: string;
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
  };
}

@Component({
  selector: 'app-patient-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-records.component.html',
  styleUrls: ['./patient-records.component.scss']
})
export class PatientRecordsComponent implements OnInit {
  patient: Patient | null = null;
  records: MedicalRecord[] = [];
  loading = false;
  showAddModal = false;
  editingRecord: MedicalRecord | null = null;
  patientId: number = 0;

  newRecord: MedicalRecord = {
    patientId: 0,
    date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    treatment: '',
    medications: '',
    notes: '',
    doctorName: '',
    visitType: 'Regular Checkup',
    vitalSigns: {
      bloodPressure: '',
      heartRate: 0,
      temperature: 0,
      weight: 0,
      height: 0
    }
  };

  visitTypes = [
    'Regular Checkup',
    'Emergency Visit',
    'Follow-up',
    'Consultation',
    'Surgery',
    'Diagnostic Test',
    'Vaccination',
    'Other'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Patient Records Component initialized');
    this.records = [];

    this.route.params.subscribe(params => {
      const idParam = params['id'];
      console.log('📋 Raw patient ID from route:', idParam);

      if (idParam) {
        if (isNaN(+idParam)) {
          console.log('📋 Using string patient ID:', idParam);
          this.loadPatientByStringId(idParam);
        } else {
          this.patientId = +idParam;
          console.log('📋 Using numeric patient ID:', this.patientId);
          this.loadPatient();
        }
        this.loadRecords();
      } else {
        console.error('❌ No patient ID found in route');
        this.showNotification('No patient ID provided', 'error');
      }
    });
  }

  loadPatientByStringId(id: string): void {
    console.log('🔍 Loading patient with string ID:', id);

    this.patientService.getPatientById(id).subscribe({
      next: (patient) => {
        console.log('✅ Patient loaded from service:', patient);
        this.patient = patient;
      },
      error: (error) => {
        console.error('❌ Error loading patient with string ID:', error);
        this.showNotification('Error loading patient information', 'error');
      }
    });
  }

  loadPatient(): void {
    console.log('🔍 Loading patient with ID:', this.patientId);

    // Create mock patient immediately
    this.patient = {
      id: this.patientId,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      birthdate: '1985-06-15',
      gender: 'Male',
      age: 39,
      bloodPressure: '128/82',
      smokingStatus: 'Never',
      registrationDate: '2024-01-15'
    };
    console.log('✅ Mock patient loaded:', this.patient);

    // Uncomment this when your service is ready:
    /*
    this.patientService.getPatientById(this.patientId.toString()).subscribe({
      next: (patient) => {
        console.log('✅ Patient loaded from service:', patient);
        this.patient = patient;
      },
      error: (error) => {
        console.error('❌ Error loading patient:', error);
        this.showNotification('Error loading patient information', 'error');
      }
    });
    */
  }

  loadRecords(): void {
    this.loading = true;
    console.log('🔍 Loading medical records for patient:', this.patientId);

    setTimeout(() => {
      this.records = this.getMockRecords();
      this.loading = false;
      console.log('✅ Mock records loaded:', this.records.length, 'records');
    }, 800);
  }

  getMockRecords(): MedicalRecord[] {
    return [
      {
        id: 1,
        patientId: this.patientId,
        date: '2024-12-15',
        diagnosis: 'Hypertension, Stage 1',
        treatment: 'Lifestyle modifications, medication therapy',
        medications: 'Lisinopril 10mg daily, Hydrochlorothiazide 25mg daily',
        notes: 'Patient reports occasional headaches. Blood pressure improved since last visit. Continue current medication regimen.',
        doctorName: 'Dr. Sarah Johnson',
        visitType: 'Follow-up',
        vitalSigns: {
          bloodPressure: '135/88',
          heartRate: 78,
          temperature: 36.8,
          weight: 79,
          height: 68
        }
      },
      {
        id: 2,
        patientId: this.patientId,
        date: '2024-11-10',
        diagnosis: 'Annual Physical Examination',
        treatment: 'Preventive care, health screening',
        medications: 'Multivitamin daily',
        notes: 'Overall health good. Recommended increased physical activity and dietary changes for weight management.',
        doctorName: 'Dr. Michael Chen',
        visitType: 'Regular Checkup',
        vitalSigns: {
          bloodPressure: '142/92',
          heartRate: 82,
          temperature: 37,
          weight: 81,
          height: 68
        }
      },
      {
        id: 3,
        patientId: this.patientId,
        date: '2024-09-22',
        diagnosis: 'Upper Respiratory Infection',
        treatment: 'Rest, fluids, symptomatic treatment',
        medications: 'Acetaminophen 650mg as needed, Dextromethorphan cough syrup',
        notes: 'Patient presented with cough, congestion, and mild fever. Symptoms consistent with viral upper respiratory infection.',
        doctorName: 'Dr. Emily Rodriguez',
        visitType: 'Emergency Visit',
        vitalSigns: {
          bloodPressure: '128/82',
          heartRate: 88,
          temperature: 38,
          weight: 80,
          height: 68
        }
      }
    ];
  }

  openAddModal(): void {
    this.showAddModal = true;
    this.resetForm();
    const currentUser = this.authService.getUser();
    if (currentUser) {
      this.newRecord.doctorName = currentUser.name;
    }
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.editingRecord = null;
    this.resetForm();
  }

  resetForm(): void {
    this.newRecord = {
      patientId: this.patientId,
      date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      treatment: '',
      medications: '',
      notes: '',
      doctorName: '',
      visitType: 'Regular Checkup',
      vitalSigns: {
        bloodPressure: '',
        heartRate: 0,
        temperature: 0,
        weight: 0,
        height: 0
      }
    };
  }

  addRecord(): void {
    if (this.validateForm()) {
      const newRecord = { ...this.newRecord, id: Date.now() };
      this.records.unshift(newRecord);
      this.closeAddModal();
      this.showNotification('Medical record added successfully', 'success');
    }
  }

  editRecord(record: MedicalRecord): void {
    this.editingRecord = record;
    this.newRecord = { ...record };
    this.showAddModal = true;
  }

  updateRecord(): void {
    if (this.editingRecord && this.validateForm()) {
      const index = this.records.findIndex(r => r.id === this.editingRecord!.id);
      if (index !== -1) {
        this.records[index] = { ...this.newRecord };
      }
      this.closeAddModal();
      this.showNotification('Medical record updated successfully', 'success');
    }
  }

  deleteRecord(record: MedicalRecord): void {
    if (confirm('Are you sure you want to delete this medical record?')) {
      this.records = this.records.filter(r => r.id !== record.id);
      this.showNotification('Medical record deleted successfully', 'success');
    }
  }

  validateForm(): boolean {
    return !!(
      this.newRecord.date &&
      this.newRecord.diagnosis &&
      this.newRecord.treatment &&
      this.newRecord.doctorName &&
      this.newRecord.visitType
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/patients']);
  }

  printRecords(): void {
    window.print();
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
}
