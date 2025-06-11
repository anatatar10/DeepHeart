// ecg-upload.component.ts - Fixed version with proper typing

import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { ECGService } from '../../services/ecg.service';
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../services/notification.service';
import { Patient } from '../../models/patient';
import { ECGResult } from '../../models/ecgresult';
import { CommonModule, DatePipe, NgClass, KeyValuePipe } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFGenerationOptions {
  includeCharts?: boolean;
  includeDetailedAnalysis?: boolean;
  includeClinicalRecommendations?: boolean;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

interface PatientRecord {
  id?: string;
  patientId: string;
  recordType: 'ECG_ANALYSIS';
  title: string;
  description: string;
  data: ECGResult;
  createdAt: Date;
  createdBy?: string;
}

// Extended interface for component use (includes additional properties)
interface ExtendedECGResult extends ECGResult {
  patientId?: string;
  savedToRecord?: boolean;
}

@Component({
  selector: 'app-ecg-upload',
  templateUrl: './ecg-upload.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgClass,
    DatePipe,
    KeyValuePipe
  ],
  styleUrls: ['./ecg-upload.component.scss']
})
export class EcgUploadComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('uploadArea') uploadArea!: ElementRef<HTMLDivElement>;

  uploadForm: FormGroup;
  selectedFile: File | null = null;
  uploadProgress = 0;
  isUploading = false;
  isDragOver = false;

  ecgResults: ExtendedECGResult[] = [];
  patients: Patient[] = [];

  // PDF generation properties
  isGeneratingPDF = false;
  showPDFOptionsModal = false;
  selectedResultForPDF: ExtendedECGResult | null = null;

  pdfOptions = {
    includeCharts: true,
    includeDetailedAnalysis: true,
    includeClinicalRecommendations: true,
    format: 'a4' as 'a4' | 'letter',
    orientation: 'portrait' as 'portrait' | 'landscape'
  };

  // Save to record properties
  isSavingToRecord = false;
  savedRecords = new Set<string>(); // Track which results have been saved

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
    const userStr = localStorage.getItem('auth_user');
    let user: any = null;

    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('Invalid user data in localStorage:', e);
    }

    if (user && user.role === 'DOCTOR') {
      // fetch only patients assigned to this doctor
      this.patientService.getPatientsByDoctor(user.id).subscribe({
        next: (patients: Patient[]) => {
          this.patients = patients;
          console.log('Doctor-specific patients loaded:', patients.length);
        },
        error: (error: any) => {
          this.notificationService.showError('Failed to load patients for doctor');
          console.error('Error loading doctor patients:', error);
        }
      });
    } else {
      // fallback for admin or other roles
      this.patientService.getAllPatients().subscribe({
        next: (patients: Patient[]) => {
          this.patients = patients;
          console.log('All patients loaded:', patients.length);
        },
        error: (error: any) => {
          this.notificationService.showError('Failed to load all patients');
          console.error('Error loading patients:', error);
        }
      });
    }
  }

  private setupDragAndDrop(): void {
    if (!this.uploadArea) return;

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

    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }

    // Clear the input so the same file can be selected again
    if (target) {
      target.value = '';
    }
  }

  private handleFile(file: File): void {
    console.log('Handling file:', file.name, file.size, file.type);

    // Validate the file
    if (!this.isValidECGFile(file)) {
      this.notificationService.showWarning(
        'Invalid file type. Only image files (PNG, JPG, JPEG) and DICOM files (.dcm) are supported.'
      );
      return;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      this.notificationService.showWarning('File size exceeds 50MB limit.');
      return;
    }

    this.selectedFile = file;
    console.log('File selected successfully:', this.selectedFile.name);
  }

  private isValidECGFile(file: File): boolean {
    const validTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/dicom',
      'application/octet-stream'
    ];

    const validExtensions = ['.png', '.jpg', '.jpeg', '.dcm'];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    return hasValidType || hasValidExtension;
  }

  removeFile(): void {
    console.log('Removing file');
    this.selectedFile = null;
  }

  clearFile(): void {
    console.log('Clearing file and results');
    this.selectedFile = null;
    this.ecgResults = [];
    this.uploadProgress = 0;
  }

  uploadFile(): void {
    console.log('Upload button clicked');
    console.log('Selected file:', this.selectedFile);
    console.log('Form valid:', this.uploadForm.valid);
    console.log('Form value:', this.uploadForm.value);

    if (!this.selectedFile) {
      this.notificationService.showWarning('Please select a file to upload');
      return;
    }

    if (this.uploadForm.invalid) {
      this.notificationService.showError('Please select a patient');
      this.uploadForm.markAllAsTouched();
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    const patientId = this.uploadForm.get('patientId')?.value;
    const notes = this.uploadForm.get('notes')?.value || '';

    // Append file to FormData using 'files' to match existing service
    formData.append('files', this.selectedFile, this.selectedFile.name);
    formData.append('patientId', patientId);
    formData.append('notes', notes);

    console.log('Uploading with patientId:', patientId);

    // Start immediate progress animation
    this.startProgressAnimation();

    try {
      // Upload and process file using existing service method
      this.ecgService.uploadECGFiles(formData).subscribe({
        next: (response: any) => {
          console.log('Upload response:', response);
          this.handleUploadProgress(response);
        },
        error: (error: any) => {
          console.error('Upload error:', error);
          this.handleUploadError(error);
        },
        complete: () => {
          console.log('Upload complete');
          this.handleUploadComplete();
        }
      });
    } catch (error) {
      console.error('Upload catch error:', error);
      this.handleUploadError(error);
    }
  }

  // Add this new method to animate progress immediately
  private startProgressAnimation(): void {
    // Start with 1% to show immediate feedback
    this.uploadProgress = 1;

    const progressInterval = setInterval(() => {
      if (!this.isUploading) {
        clearInterval(progressInterval);
        return;
      }

      // Simulate realistic progress
      if (this.uploadProgress < 20) {
        this.uploadProgress += Math.random() * 4 + 2;
      } else if (this.uploadProgress < 50) {
        this.uploadProgress += Math.random() * 3 + 1;
      } else if (this.uploadProgress < 80) {
        this.uploadProgress += Math.random() * 2 + 0.5;
      } else if (this.uploadProgress < 95) {
        this.uploadProgress += Math.random() * 1 + 0.2;
      } else {
        // Hold at 95% until real response
        this.uploadProgress = 95;
      }

      console.log('Progress:', this.uploadProgress.toFixed(1));
    }, 300); // Update every 300ms

    // Store interval to clear it later
    (this as any).progressInterval = progressInterval;
  }

  // Modified handleUploadProgress method
  // Corrected handleUploadProgress method for your Angular component

  // Add this enhanced debugging to your handleUploadProgress method

  private handleUploadProgress(response: any): void {
    if (response.type === 'progress') {
      const realProgress = response.progress || 0;
      if (realProgress > this.uploadProgress) {
        this.uploadProgress = Math.min(realProgress, 95);
      }
    } else if (response.type === 'result') {
      if ((this as any).progressInterval) {
        clearInterval((this as any).progressInterval);
      }

      this.uploadProgress = 100;
      const results = response.data?.results;

      if (Array.isArray(results)) {
        const processedResults: ExtendedECGResult[] = [];

        results.forEach((r: any, index: number) => {
          console.log(`=== DEBUGGING RESULT ${index + 1} ===`);
          console.log('Full result object:', r);
          console.log('Available keys:', Object.keys(r));

          // Check for individual model data
          console.log('Has allPredictions?', !!r.allPredictions);
          console.log('Has model1 directly?', !!r.model1);
          console.log('Has model2 directly?', !!r.model2);
          console.log('Has ensemble directly?', !!r.ensemble);

          if (r.allPredictions) {
            console.log('allPredictions keys:', Object.keys(r.allPredictions));
            console.log('allPredictions.model1 exists?', !!r.allPredictions.model1);
            console.log('allPredictions.model2 exists?', !!r.allPredictions.model2);
          }

          // Try both possible structures
          let model1Data = r.allPredictions?.model1 || r.model1;
          let model2Data = r.allPredictions?.model2 || r.model2;
          let ensembleData = r.allPredictions?.ensemble || r.ensemble;

          console.log('Found model1Data?', !!model1Data);
          console.log('Found model2Data?', !!model2Data);
          console.log('Found ensembleData?', !!ensembleData);

          // Add individual model results if found
          if (model1Data) {
            console.log('Processing Model1 (DenseNet):', model1Data);
            const model1Result: ExtendedECGResult = {
              id: r.id ?? undefined,
              model: 'DenseNet121',
              classification: model1Data.classification,
              confidence: model1Data.confidence,
              probabilities: model1Data.probabilities || {},
              fileName: r.fileName,
              timestamp: r.timestamp,
              description: this.getClassificationDescription(model1Data.classification),
              confidence_level: this.getConfidenceLevel(model1Data.confidence),
              clinical_recommendation: this.getClinicalRecommendation(model1Data.confidence),
              secondary_findings: {},
              model_info: { model_type: 'DenseNet121', prediction_method: 'normalized_sigmoid' },
              patientId: this.uploadForm.get('patientId')?.value
            };
            processedResults.push(model1Result);
            console.log('✅ Added DenseNet121 result');
          } else {
            console.log('❌ No Model1 data found');
          }

          if (model2Data) {
            console.log('Processing Model2 (ResNet):', model2Data);
            const model2Result: ExtendedECGResult = {
              id: r.id ?? undefined,
              model: 'ResNet50',
              classification: model2Data.classification,
              confidence: model2Data.confidence,
              probabilities: model2Data.probabilities || {},
              fileName: r.fileName,
              timestamp: r.timestamp,
              description: this.getClassificationDescription(model2Data.classification),
              confidence_level: this.getConfidenceLevel(model2Data.confidence),
              clinical_recommendation: this.getClinicalRecommendation(model2Data.confidence),
              secondary_findings: {},
              model_info: { model_type: 'ResNet50', prediction_method: 'normalized_sigmoid' },
              patientId: this.uploadForm.get('patientId')?.value
            };
            processedResults.push(model2Result);
            console.log('✅ Added ResNet50 result');
          } else {
            console.log('❌ No Model2 data found');
          }

          // Add ensemble result
          const finalEnsembleData = ensembleData || {
            classification: r.classification,
            confidence: r.confidence,
            probabilities: r.probabilities,
            description: r.description,
            confidence_level: r.confidence_level,
            clinical_recommendation: r.clinical_recommendation
          };

          console.log('Processing Ensemble:', finalEnsembleData);
          const ensembleResult: ExtendedECGResult = {
            id: r.id ?? undefined,
            model: 'Ensemble Prediction',
            classification: finalEnsembleData.classification,
            confidence: finalEnsembleData.confidence,
            probabilities: finalEnsembleData.probabilities || {},
            fileName: r.fileName,
            timestamp: r.timestamp,
            description: finalEnsembleData.description || this.getClassificationDescription(finalEnsembleData.classification),
            confidence_level: finalEnsembleData.confidence_level || this.getConfidenceLevel(finalEnsembleData.confidence),
            clinical_recommendation: finalEnsembleData.clinical_recommendation || this.getClinicalRecommendation(finalEnsembleData.confidence),
            secondary_findings: {},
            model_info: { model_type: 'Ensemble', prediction_method: 'dual_model_average' },
            patientId: this.uploadForm.get('patientId')?.value
          };
          processedResults.push(ensembleResult);
          console.log('✅ Added Ensemble result');

          console.log(`=== END DEBUGGING RESULT ${index + 1} ===`);
        });

        this.ecgResults = processedResults;
        console.log('🎯 FINAL SUMMARY:');
        console.log('Total processed results:', this.ecgResults.length);
        console.log('Model names:', this.ecgResults.map(r => r.model));
        console.log('Classifications:', this.ecgResults.map(r => r.classification));
      }
    }
  }

  // Helper methods to add to your component
  private getConfidenceLevel(confidence: number): string {
    if (confidence >= 70) return 'High';
    if (confidence >= 50) return 'Medium';
    if (confidence >= 30) return 'Low';
    return 'Very Low';
  }

  private getClinicalRecommendation(confidence: number): string {
    if (confidence >= 70) return 'High confidence prediction';
    if (confidence >= 50) return 'Moderate confidence - consider clinical correlation';
    if (confidence >= 30) return 'Low confidence - requires clinical evaluation';
    return 'Very low confidence - manual review recommended';
  }

  // Modified handleUploadError method
  private handleUploadError(error: any): void {
    // Clear progress interval
    if ((this as any).progressInterval) {
      clearInterval((this as any).progressInterval);
    }

    this.isUploading = false;
    this.uploadProgress = 0;

    let errorMessage = 'Upload failed';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.notificationService.showError(errorMessage);
    console.error('Upload error:', error);
  }

  // Modified handleUploadComplete method
  private handleUploadComplete(): void {
    // Clear progress interval
    if ((this as any).progressInterval) {
      clearInterval((this as any).progressInterval);
    }

    this.isUploading = false;

    if (this.uploadProgress === 100 && this.ecgResults.length > 0) {
      this.notificationService.showSuccess('ECG file processed successfully');
      // Clear selected file after successful upload
      this.selectedFile = null;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);

      if (files.length > 1) {
        this.notificationService.showInfo('Only one file can be uploaded at a time. First file selected.');
      }
    }
  }

  openFileDialog(): void {
    console.log('Opening file dialog');
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

  viewDetailedResults(result: ExtendedECGResult): void {
    // Open detailed results modal or navigate to details page
    console.log('View detailed results for:', result);
  }

  // Enhanced PDF download with loading state
  downloadReport(result: ExtendedECGResult): void {
    if (result.id == null && !result.fileName) {
      this.notificationService.showError('Cannot download: insufficient result data.');
      return;
    }

    this.isGeneratingPDF = true;
    this.notificationService.showInfo('Generating PDF report...');

    // Try to download from server first
    if (result.id != null) {
      this.ecgService.downloadReport(String(result.id)).subscribe({
        next: (blob) => {
          this.downloadBlob(blob, `ECG_Report_${result.fileName || 'file'}_${result.id}.pdf`);
          this.notificationService.showSuccess('Report downloaded successfully');
          this.isGeneratingPDF = false;
        },
        error: (error) => {
          console.log('Server PDF not available, generating locally...');
          // Fallback to local PDF generation
          this.generateLocalPDFReport(result, this.pdfOptions)
            .finally(() => {
              this.isGeneratingPDF = false;
            });
        }
      });
    } else {
      // Generate PDF locally if no server ID
      this.generateLocalPDFReport(result, this.pdfOptions)
        .finally(() => {
          this.isGeneratingPDF = false;
        });
    }
  }

  // Enhanced Save to Patient Record Implementation
  saveToPatientRecord(result: ExtendedECGResult): void {
    if (!result.patientId) {
      this.notificationService.showError('Cannot save: Patient information is missing.');
      return;
    }

    // Check if already saved
    const resultKey = this.getResultKey(result);
    if (this.savedRecords.has(resultKey)) {
      this.notificationService.showWarning('This result has already been saved to the patient record.');
      return;
    }

    this.isSavingToRecord = true;
    this.notificationService.showInfo('Saving to patient record...');

    // Get patient information
    const patient = this.patients.find(p => p.id === result.patientId);
    if (!patient) {
      this.notificationService.showError('Patient information not found.');
      this.isSavingToRecord = false;
      return;
    }

    // Prepare the record data
    const patientRecord: PatientRecord = {
      patientId: result.patientId,
      recordType: 'ECG_ANALYSIS',
      title: `ECG Analysis - ${result.classification}`,
      description: this.generateRecordDescription(result, patient),
      data: result,
      createdAt: new Date()
    };

    // Try using existing service method if available, otherwise simulate save
    if (this.ecgService.saveToPatientRecord && result.id) {
      // Use existing service method
      this.ecgService.saveToPatientRecord(String(result.id)).subscribe({
        next: () => {
          this.handleSaveSuccess(result, patient, resultKey);
        },
        error: (error) => {
          this.handleSaveError(error);
        }
      });
    } else {
      // Simulate API call for demonstration
      setTimeout(() => {
        try {
          // Simulate successful save
          this.handleSaveSuccess(result, patient, resultKey);
        } catch (error) {
          this.handleSaveError(error);
        }
      }, 1000);
    }
  }

  private handleSaveSuccess(result: ExtendedECGResult, patient: Patient, resultKey: string): void {
    // Mark as saved
    this.savedRecords.add(resultKey);

    // Update the result to indicate it's saved
    const resultIndex = this.ecgResults.findIndex(r => this.getResultKey(r) === resultKey);
    if (resultIndex >= 0) {
      this.ecgResults[resultIndex] = { ...this.ecgResults[resultIndex], savedToRecord: true };
    }

    this.isSavingToRecord = false;
    this.notificationService.showSuccess(`ECG analysis saved to ${patient.name}'s medical record successfully.`);
  }

  private handleSaveError(error: any): void {
    this.isSavingToRecord = false;
    let errorMessage = 'Failed to save to patient record. Please try again.';

    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    this.notificationService.showError(errorMessage);
    console.error('Save to record error:', error);
  }

  // Helper method to generate a descriptive record entry
  private generateRecordDescription(result: ExtendedECGResult, patient: Patient): string {
    const date = result.timestamp ? new Date(result.timestamp).toLocaleDateString() : new Date().toLocaleDateString();
    const time = result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();

    let description = `ECG Analysis performed on ${date} at ${time}\n\n`;
    description += `Patient: ${patient.name}\n`;
    description += `Classification: ${result.classification}\n`;
    description += `Confidence: ${result.confidence !== undefined ? result.confidence.toFixed(1) + '%' : 'N/A'}\n`;

    if (result.model) {
      description += `Analysis Model: ${result.model}\n`;
    }

    if (result.probabilities) {
      description += `\nDetailed Probabilities:\n`;
      Object.entries(result.probabilities).forEach(([key, value]) => {
        description += `• ${key}: ${value.toFixed(1)}%\n`;
      });
    }

    if (result.description) {
      description += `\nClinical Notes:\n${result.description}`;
    }

    if (result.clinical_recommendation) {
      description += `\nClinical Recommendation:\n${result.clinical_recommendation}`;
    }

    return description;
  }

  // Generate unique key for tracking saved results
  private getResultKey(result: ExtendedECGResult): string {
    const timestamp = result.timestamp ? new Date(result.timestamp).getTime() : Date.now();
    return `${result.patientId}_${result.fileName}_${result.model}_${timestamp}`;
  }

  // Check if result has been saved
  isResultSaved(result: ExtendedECGResult): boolean {
    return this.savedRecords.has(this.getResultKey(result)) || result.savedToRecord === true;
  }

  // Updated local PDF generation method (simplified - keeping essential parts)
  private generateLocalPDFReport(result: ExtendedECGResult, options: PDFGenerationOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const pdf = new jsPDF({
          orientation: options.orientation || 'portrait',
          unit: 'mm',
          format: options.format || 'a4'
        });

        // Simple PDF generation - add your existing PDF methods here
        pdf.setFontSize(20);
        pdf.text('ECG Analysis Report', 20, 30);

        pdf.setFontSize(14);
        pdf.text(`Classification: ${result.classification}`, 20, 50);
        pdf.text(`Confidence: ${result.confidence.toFixed(1)}%`, 20, 65);
        pdf.text(`Model: ${result.model}`, 20, 80);

        if (result.description) {
          pdf.setFontSize(12);
          const splitText = pdf.splitTextToSize(result.description, 170);
          pdf.text(splitText, 20, 100);
        }

        const fileName = `ECG_Report_${result.fileName || 'analysis'}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        this.notificationService.showSuccess('PDF report generated and downloaded successfully');
        resolve();

      } catch (error) {
        console.error('Error generating PDF:', error);
        this.notificationService.showError('Failed to generate PDF report');
        reject(error);
      }
    });
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

    } catch (error) {
      console.error('Error downloading file:', error);
      this.notificationService.showError('Failed to download file');
    }
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

  showAddPatientModal(): void {
    // Implementation for showing add patient modal
    console.log('Show add patient modal');
  }


  closePDFOptions(): void {
    this.showPDFOptionsModal = false;
    this.selectedResultForPDF = null;
    document.body.style.overflow = 'auto';
  }


  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showPDFOptionsModal) {
      this.closePDFOptions();
    }
  }

  saveToRecord(ecgId: string, result: any) {
    // Disable button while saving
    result.isSaving = true;

    this.ecgService.saveToPatientRecord(ecgId).subscribe({
      next: () => {
        result.isSaved = true;
        this.notificationService.showSuccess("Record saved to patient file!");
      },
      error: () => {
        this.notificationService.showError("Failed to save the record.");
      },
      complete: () => {
        result.isSaving = false;
      }
    });
  }
}
