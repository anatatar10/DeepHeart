// ecg-upload.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { ECGService } from '../services/upload.service';
import { PatientService } from '../services/patient.service';
import { NotificationService } from '../services/notification.service';

export interface ECGResult {
  id: string;
  fileName: string;
  classification: string;
  confidence: number;
  probabilities: { [key: string]: number };
  timestamp: string;
  patientId?: string;
  processed: boolean;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
}

@Component({
  selector: 'app-ecg-upload',
  templateUrl: './ecg-upload.component.html',
  styleUrls: ['./ecg-upload.component.scss']
})
export class EcgUploadComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('uploadArea') uploadArea!: ElementRef<HTMLDivElement>;

  uploadForm: FormGroup;
  selectedFiles: File[] = [];
  uploadProgress = 0;
  isUploading = false;
  isDragOver = false;

  ecgResults: ECGResult[] = [];
  patients: Patient[] = [];

  // Upload status
  uploadStatus = {
    total: 0,
    processed: 0,
    failed: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private ecgService: ECGService,
    private patientService: PatientService,
    private notificationService: NotificationService
  ) {
    this.uploadForm = this.fb.group({
      patientId: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    this.setupDragAndDrop();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
      },
      error: (error) => {
        this.notificationService.showError('Failed to load patients');
        console.error('Error loading patients:', error);
      }
    });
  }

  private setupDragAndDrop(): void {
    const uploadArea = this.uploadArea.nativeElement;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, this.preventDefaults.bind(this), false);
      document.body.addEventListener(eventName, this.preventDefaults.bind(this), false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => this.isDragOver = true, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => this.isDragOver = false, false);
    });

    // Handle dropped files
    uploadArea.addEventListener('drop', this.handleDrop.bind(this), false);
  }

  private preventDefaults(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
  }

  private handleDrop(e: DragEvent): void {
    const dt = e.dataTransfer;
    const files = dt?.files;

    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  private handleFiles(files: File[]): void {
    // Filter for valid ECG file types
    const validFiles = files.filter(file => this.isValidECGFile(file));

    if (validFiles.length !== files.length) {
      this.notificationService.showWarning(
        `${files.length - validFiles.length} files were rejected. Only image files and DICOM files are supported.`
      );
    }

    this.selectedFiles = [...this.selectedFiles, ...validFiles];

    if (this.selectedFiles.length > 10) {
      this.notificationService.showWarning('Maximum 10 files can be uploaded at once');
      this.selectedFiles = this.selectedFiles.slice(0, 10);
    }
  }

  private isValidECGFile(file: File): boolean {
    const validTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/dicom',
      'application/octet-stream' // For .dcm files
    ];

    const validExtensions = ['.png', '.jpg', '.jpeg', '.dcm'];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    return hasValidType || hasValidExtension;
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  clearFiles(): void {
    this.selectedFiles = [];
    this.ecgResults = [];
    this.resetUploadStatus();
  }

  private resetUploadStatus(): void {
    this.uploadStatus = {
      total: 0,
      processed: 0,
      failed: 0
    };
    this.uploadProgress = 0;
  }

  async uploadFiles(): Promise<void> {
    if (this.selectedFiles.length === 0) {
      this.notificationService.showWarning('Please select files to upload');
      return;
    }

    if (this.uploadForm.invalid) {
      this.notificationService.showError('Please select a patient');
      return;
    }

    this.isUploading = true;
    this.resetUploadStatus();
    this.uploadStatus.total = this.selectedFiles.length;

    const formData = new FormData();
    const patientId = this.uploadForm.get('patientId')?.value;
    const notes = this.uploadForm.get('notes')?.value || '';

    // Append files to FormData
    this.selectedFiles.forEach((file, index) => {
      formData.append('files', file, file.name);
    });

    formData.append('patientId', patientId);
    formData.append('notes', notes);

    try {
      // Upload and process files
      this.ecgService.uploadECGFiles(formData).subscribe({
        next: (response) => {
          this.handleUploadProgress(response);
        },
        error: (error) => {
          this.handleUploadError(error);
        },
        complete: () => {
          this.handleUploadComplete();
        }
      });
    } catch (error) {
      this.handleUploadError(error);
    }
  }

  private handleUploadProgress(response: any): void {
    if (response.type === 'progress') {
      this.uploadProgress = response.progress;
    } else if (response.type === 'result') {
      this.uploadStatus.processed++;
      this.ecgResults.push(response.data);

      // Update progress based on processed files
      this.uploadProgress = (this.uploadStatus.processed / this.uploadStatus.total) * 100;
    }
  }

  private handleUploadError(error: any): void {
    this.isUploading = false;
    this.uploadStatus.failed++;

    let errorMessage = 'Upload failed';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.notificationService.showError(errorMessage);
    console.error('Upload error:', error);
  }

  private handleUploadComplete(): void {
    this.isUploading = false;

    const successCount = this.uploadStatus.processed;
    const failedCount = this.uploadStatus.failed;

    if (successCount > 0) {
      this.notificationService.showSuccess(
        `${successCount} ECG file(s) processed successfully`
      );
    }

    if (failedCount > 0) {
      this.notificationService.showWarning(
        `${failedCount} file(s) failed to process`
      );
    }

    // Clear selected files after successful upload
    if (successCount > 0) {
      this.selectedFiles = [];
    }
  }

  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }

  getClassificationColor(classification: string): string {
    const colors = {
      'NORM': 'success',
      'MI': 'error',
      'STTC': 'warning',
      'CD': 'warning',
      'HYP': 'info'
    };
    return colors[classification as keyof typeof colors] || 'info';
  }

  getClassificationDescription(classification: string): string {
    const descriptions = {
      'NORM': 'Normal sinus rhythm detected. No significant abnormalities identified.',
      'MI': 'Myocardial infarction patterns detected. Immediate cardiology consultation recommended.',
      'STTC': 'ST/T wave changes observed. May indicate ischemia or other cardiac conditions.',
      'CD': 'Conduction disturbances detected. Abnormal electrical conduction patterns.',
      'HYP': 'Hypertrophy patterns identified. Enlarged heart chambers detected.'
    };
    return descriptions[classification as keyof typeof descriptions] || 'Classification completed.';
  }

  viewDetailedResults(result: ECGResult): void {
    // Open detailed results modal or navigate to details page
    // This would be implemented based on your routing/modal strategy
    console.log('View detailed results for:', result);
  }

  downloadReport(result: ECGResult): void {
    this.ecgService.downloadReport(result.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ECG_Report_${result.fileName}_${result.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.notificationService.showError('Failed to download report');
        console.error('Download error:', error);
      }
    });
  }

  saveToPatientRecord(result: ECGResult): void {
    this.ecgService.saveToPatientRecord(result.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('ECG result saved to patient record');
      },
      error: (error) => {
        this.notificationService.showError('Failed to save to patient record');
        console.error('Save error:', error);
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getSelectedPatientName(): string {
    const patientId = this.uploadForm.get('patientId')?.value;
    const patient = this.patients.find(p => p.id === patientId);
    return patient ? patient.name : '';
  }
}
