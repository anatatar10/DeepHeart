import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';
import { ECGService } from '../../services/ecg.service';
import { Patient } from '../../models/patient';
import { ECGResult } from '../../models/ecgresult';
import {ECGHistoryResult} from '../../models/ecg-history-result';



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

// Enhanced ECGRecord interface to match your actual data structure
interface ECGRecord {
  id?: string;
  patientId: string;
  fileName: string;
  classification: string;
  confidence: number;
  probabilities?: { [key: string]: number };
  timestamp: string;
  description?: string;
  confidence_level?: string;
  clinical_recommendation?: string;
  model: string;
  model_info?: any;
  secondary_findings?: any;
  recordType?: 'ECG_ANALYSIS';
  title?: string;
  createdAt?: Date;
  createdBy?: string;
  // Add missing properties that template expects
  date?: string;
  recordingType?: string;
  leadConfiguration?: string;
  duration?: number;
  sampleRate?: number;
  technician?: string;
  analysis?: {
    heartRate: number;
    rhythm: string;
    abnormalities: string[];
    interpretation: string;
  };
  doctorReview?: {
    reviewedBy: string;
    reviewDate: string;
    findings: string;
    recommendations: string;
  };
  notes?: string;
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
  ecgRecords: ECGRecord[] = [];
  loading = false;
  loadingECG = false;
  showAddModal = false;
  showECGModal = false;
  showECGViewer = false;
  editingRecord: MedicalRecord | null = null;
  selectedECGRecord: ECGRecord | null = null;
  patientId: number = 0;
  patientStringId: string = '';
  activeTab: 'medical' | 'ecg' = 'medical';

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

  private mapHistoryToECGResults(historyResults: ECGHistoryResult[]): ECGResult[] {
    return historyResults.map(result => ({
      id: result.id,
      fileName: result.fileName,
      classification: result.classification,
      confidence: result.confidence,
      probabilities: result.probabilities,
      timestamp: result.timestamp,
      description: result.description,
      model: "Unknown",  // you can replace this if you want with "DenseNet" or "Ensemble"
      confidence_level: "N/A",
      clinical_recommendation: "N/A",
      secondary_findings: {},
      model_info: {},
      patientId: result.patientId,
      savedToRecord: result.status === 'Saved to Patient Record'
    }));
  }

  // Add missing ECG form properties
  newECGRecord: any = {
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    recordingType: 'resting',
    leadConfiguration: '12-lead',
    duration: 10,
    technician: '',
    analysis: {
      heartRate: 0,
      rhythm: '',
      interpretation: ''
    },
    notes: ''
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

  // Add missing arrays for ECG form
  ecgRecordingTypes = [
    { value: 'resting', label: 'Resting ECG' },
    { value: 'stress', label: 'Stress Test ECG' },
    { value: 'holter', label: 'Holter Monitor' },
    { value: 'event', label: 'Event Monitor' }
  ];

  leadConfigurations = [
    '3-lead',
    '6-lead',
    '12-lead',
    '15-lead',
    '18-lead'
  ];

  constructor(
    private route: ActivatedRoute,
    public router: Router, // Make router public
    private patientService: PatientService,
    private authService: AuthService,
    private ecgService: ECGService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Patient Records Component initialized');
    this.records = [];
    this.ecgRecords = [];

    this.route.params.subscribe(params => {
      const idParam = params['id'];
      console.log('📋 Raw patient ID from route:', idParam);

      if (idParam) {
        if (isNaN(+idParam)) {
          console.log('📋 Using string patient ID:', idParam);
          this.patientStringId = idParam;
          this.loadPatientByStringId(idParam);
        } else {
          this.patientId = +idParam;
          this.patientStringId = idParam.toString();
          console.log('📋 Using numeric patient ID:', this.patientId);
          this.loadPatient();
        }
        this.loadRecords();
        this.loadECGRecords();
      } else {
        console.error('❌ No patient ID found in route');
        this.showNotification('No patient ID provided', 'error');
      }
    });
  }

  showEcgImageModal = false;
  ecgImageUrl: string = '';

  viewEcgImage(record: ECGRecord): void {
    const baseUrl = 'http://localhost:8080/api/ecg/files/';
    this.ecgImageUrl = baseUrl + record.fileName;
    this.showEcgImageModal = true;
  }

  closeEcgImageModal(): void {
    this.showEcgImageModal = false;
    this.ecgImageUrl = '';
  }

  loadPatientByStringId(id: string): void {
    console.log('🔍 Loading patient with string ID:', id);

    this.patientService.getPatientById(id).subscribe({
      next: (patient) => {
        console.log('✅ Patient loaded from service:', patient);
        this.patient = patient;
        this.patientStringId = patient.id?.toString() || id;
      },
      error: (error) => {
        console.error('❌ Error loading patient with string ID:', error);
        this.showNotification('Error loading patient information', 'error');
      }
    });
  }

  loadPatient(): void {
    console.log('🔍 Loading patient with ID:', this.patientId);

    // Try to load from service first
    this.patientService.getPatientById(this.patientId.toString()).subscribe({
      next: (patient) => {
        console.log('✅ Patient loaded from service:', patient);
        this.patient = patient;
        this.patientStringId = patient.id?.toString() || this.patientId.toString();
      },
      error: (error) => {
        console.error('❌ Error loading patient:', error);
        // Fallback to mock patient
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
      }
    });
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

  loadECGRecords(): void {
    this.loadingECG = true;
    const patientId = this.patientStringId || this.patientId.toString();
    console.log('🔍 Loading ECG records for patient:', patientId);

    this.ecgService.getPatientECGRecords(patientId).subscribe({
      next: (historyResults: ECGHistoryResult[]) => {
        console.log('✅ ECG records received:', historyResults);
        const ecgResults: ECGResult[] = this.mapHistoryToECGResults(historyResults);
        this.ecgRecords = this.mapECGResultsToRecords(ecgResults);
        this.loadingECG = false;
      },
      error: (error) => {
        console.error('❌ ERROR while loading ECG history:', JSON.stringify(error, null, 2));
        console.error('Full Error Object:', error);        this.loadingECG = false;
        this.showNotification('Failed to load ECG history', 'error');
      }
    });
  }

  // Convert ECGResult objects to ECGRecord format for display
  private mapECGResultsToRecords(ecgResults: ECGResult[]): ECGRecord[] {
    return ecgResults.map(result => ({
      id: result.id?.toString(),
      patientId: this.patientStringId || this.patientId.toString(),
      fileName: result.fileName || 'Unknown File',
      classification: result.classification || 'Unknown',
      confidence: result.confidence || 0,
      probabilities: result.probabilities,
      timestamp: result.timestamp || new Date().toISOString(),
      description: result.description || this.getClassificationDescription(result.classification),
      confidence_level: result.confidence_level || this.getConfidenceLevel(result.confidence),
      clinical_recommendation: result.clinical_recommendation || this.getClinicalRecommendation(result.confidence),
      model: result.model || 'ECG Analysis',
      model_info: result.model_info,
      secondary_findings: result.secondary_findings,
      recordType: 'ECG_ANALYSIS',
      // Map to expected template properties
      date: result.timestamp || new Date().toISOString(),
      recordingType: 'resting', // Default value
      leadConfiguration: '12-lead', // Default value
      duration: 10, // Default value
      sampleRate: 500, // Default value
      technician: 'ECG Technician', // Default value
      analysis: {
        heartRate: 75, // Default or extract from result
        rhythm: 'Normal Sinus Rhythm', // Default or extract from result
        abnormalities: [], // Default empty array
        interpretation: result.description || this.getClassificationDescription(result.classification)
      },
      notes: result.description
    }));
  }

  // Helper methods for ECG data
  private getClassificationDescription(classification: string): string {
    const descriptions = {
      'NORM': 'Normal sinus rhythm detected. No significant abnormalities identified.',
      'MI': 'Myocardial infarction patterns detected. Immediate cardiology consultation recommended.',
      'STTC': 'ST/T wave changes observed. May indicate ischemia or other cardiac conditions.',
      'CD': 'Conduction disturbances detected. Abnormal electrical conduction patterns.',
      'HYP': 'Hypertrophy patterns identified. Enlarged heart chambers detected.'
    };
    return descriptions[classification as keyof typeof descriptions] || 'ECG analysis completed.';
  }

  private getConfidenceLevel(confidence: number): string {
    if (confidence >= 70) return 'High';
    if (confidence >= 50) return 'Medium';
    if (confidence >= 30) return 'Low';
    return 'Very Low';
  }

  private getClinicalRecommendation(confidence: number): string {
    if (confidence >= 70) return 'High confidence prediction - proceed with clinical correlation';
    if (confidence >= 50) return 'Moderate confidence - consider additional testing';
    if (confidence >= 30) return 'Low confidence - requires clinical evaluation';
    return 'Very low confidence - manual review recommended';
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
      }
    ];
  }

  // Tab switching
  switchTab(tab: 'medical' | 'ecg'): void {
    this.activeTab = tab;

    if (tab === 'ecg') {
      this.loadECGRecords();
    }
  }

  // Medical record methods
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

  // ECG record methods
  closeECGModal(): void {
    this.showECGModal = false;
    // Reset form if needed
  }

  addECGRecord(): void {
    // Implementation for adding ECG record
    console.log('Adding ECG record:', this.newECGRecord);
    this.closeECGModal();
  }

  viewECG(record: ECGRecord | null): void {
    if (!record) {
      this.showNotification('Cannot view: ECG record not found', 'error');
      return;
    }

    this.selectedECGRecord = record;
    this.showECGViewer = true;
  }

  closeECGViewer(): void {
    this.showECGViewer = false;
    this.selectedECGRecord = null;
  }

  deleteECGRecord(record: ECGRecord | null): void {
    if (!record) {
      this.showNotification('Cannot delete: ECG record not found', 'error');
      return;
    }

    if (confirm('Are you sure you want to delete this ECG record?')) {
      if (record.id) {
        this.ecgService.deleteECGResult(record.id).subscribe({
          next: () => {
            this.ecgRecords = this.ecgRecords.filter(r => r.id !== record.id);
            this.showNotification('ECG record deleted successfully', 'success');
          },
          error: (error) => {
            console.error('Error deleting ECG record:', error);
            this.showNotification('Error deleting ECG record', 'error');
          }
        });
      } else {
        this.ecgRecords = this.ecgRecords.filter(r => r !== record);
        this.showNotification('ECG record removed', 'success');
      }
    }
  }

  downloadECGReport(record: ECGRecord | null): void {
    if (!record || !record.id) {
      this.showNotification('Cannot download report: ECG record not found', 'error');
      return;
    }

    this.ecgService.downloadReport(record.id).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `ECG_Report_${record.fileName}_${record.id}.pdf`);
        this.showNotification('Report downloaded successfully', 'success');
      },
      error: (error) => {
        console.error('Error downloading report:', error);
        this.showNotification('Error downloading report', 'error');
      }
    });
  }

  // Add missing method expected by template
  getRecordingTypeLabel(type: string): string {
    const typeObj = this.ecgRecordingTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  getClassificationColor(classification: string): string {
    const colors = {
      'NORM': '#10b981', // green
      'MI': '#ef4444',   // red
      'STTC': '#f59e0b', // yellow
      'CD': '#f59e0b',   // yellow
      'HYP': '#3b82f6'   // blue
    };
    return colors[classification as keyof typeof colors] || '#6b7280';
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 70) return '#10b981'; // green
    if (confidence >= 50) return '#f59e0b'; // yellow
    if (confidence >= 30) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  // Utility methods
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
