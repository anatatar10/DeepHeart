// ecg-upload.component.ts
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

  ecgResults: ECGResult[] = [];
  patients: Patient[] = [];

  // PDF generation properties
  isGeneratingPDF = false;
  showPDFOptionsModal = false;
  selectedResultForPDF: ECGResult | null = null;

  pdfOptions = {
    includeCharts: true,
    includeDetailedAnalysis: true,
    includeClinicalRecommendations: true,
    format: 'a4' as 'a4' | 'letter',
    orientation: 'portrait' as 'portrait' | 'landscape'
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
  private handleUploadProgress(response: any): void {
    if (response.type === 'progress') {
      // Use real HTTP progress if available
      const realProgress = response.progress || 0;
      if (realProgress > this.uploadProgress) {
        this.uploadProgress = Math.min(realProgress, 95);
      }
    } else if (response.type === 'result') {
      // Clear interval and finish progress
      if ((this as any).progressInterval) {
        clearInterval((this as any).progressInterval);
      }

      // Complete progress
      this.uploadProgress = 100;

      // Process results
      const results = response.data?.results;

      if (Array.isArray(results)) {
        // Process each file's results
        const processedResults: ECGResult[] = [];

        results.forEach((r: any) => {
          console.log('Processing result:', r);

          // Main ensemble result
          const ensembleResult: ECGResult = {
            id: r.id ?? undefined,
            model: 'Ensemble Prediction',
            classification: r.classification,
            confidence: r.confidence,
            probabilities: r.probabilities || {},
            fileName: r.fileName,
            timestamp: r.timestamp,
            description: r.description || '',
            confidence_level: r.confidence_level || '',
            clinical_recommendation: r.clinical_recommendation || '',
            secondary_findings: r.secondary_findings || {},
            model_info: { model_type: 'Ensemble', prediction_method: 'dual_model_average' }
          };
          processedResults.push(ensembleResult);

          // Individual model results (if available)
          if (r.allPredictions) {
            // Model 1 (DenseNet)
            if (r.allPredictions.model1) {
              const model1 = r.allPredictions.model1;
              const model1Result: ECGResult = {
                id: r.id ?? undefined,
                model: 'DenseNet121',
                classification: model1.classification,
                confidence: model1.confidence,
                probabilities: model1.probabilities || {},
                fileName: r.fileName,
                timestamp: r.timestamp,
                description: this.getClassificationDescription(model1.classification),
                confidence_level: this.getConfidenceLevel(model1.confidence),
                clinical_recommendation: this.getClinicalRecommendation(model1.confidence),
                secondary_findings: {},
                model_info: { model_type: 'DenseNet121', prediction_method: 'normalized_sigmoid' }
              };
              processedResults.push(model1Result);
            }

            // Model 2 (ResNet)
            if (r.allPredictions.model2) {
              const model2 = r.allPredictions.model2;
              const model2Result: ECGResult = {
                id: r.id ?? undefined,
                model: 'ResNet50',
                classification: model2.classification,
                confidence: model2.confidence,
                probabilities: model2.probabilities || {},
                fileName: r.fileName,
                timestamp: r.timestamp,
                description: this.getClassificationDescription(model2.classification),
                confidence_level: this.getConfidenceLevel(model2.confidence),
                clinical_recommendation: this.getClinicalRecommendation(model2.confidence),
                secondary_findings: {},
                model_info: { model_type: 'ResNet', prediction_method: 'normalized_sigmoid' }
              };
              processedResults.push(model2Result);
            }
          }
        });

        this.ecgResults = processedResults;
        console.log('Final processed results:', this.ecgResults);
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

  viewDetailedResults(result: ECGResult): void {
    // Open detailed results modal or navigate to details page
    console.log('View detailed results for:', result);
  }

  // Enhanced PDF download with loading state
  downloadReport(result: ECGResult): void {
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

  // Show PDF options modal
  showPDFOptions(result: ECGResult): void {
    this.selectedResultForPDF = result;
    this.showPDFOptionsModal = true;
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  // Close PDF options modal
  closePDFOptions(): void {
    this.showPDFOptionsModal = false;
    this.selectedResultForPDF = null;
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  // Generate PDF with custom options
  generateCustomPDF(): void {
    if (!this.selectedResultForPDF) {
      this.notificationService.showError('No result selected for PDF generation');
      return;
    }

    this.isGeneratingPDF = true;
    this.notificationService.showInfo('Generating custom PDF report...');

    this.generateLocalPDFReport(this.selectedResultForPDF, this.pdfOptions)
      .finally(() => {
        this.isGeneratingPDF = false;
        this.closePDFOptions();
      });
  }

  // Updated local PDF generation method (returns Promise)
  private generateLocalPDFReport(result: ECGResult, options: PDFGenerationOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const {
          includeCharts = true,
          includeDetailedAnalysis = true,
          includeClinicalRecommendations = true,
          format = 'a4',
          orientation = 'portrait'
        } = options;

        // Create PDF document
        const pdf = new jsPDF({
          orientation: orientation,
          unit: 'mm',
          format: format
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        let currentY = margin;

        // Add header
        currentY = this.addPDFHeader(pdf, currentY, margin, contentWidth);

        // Add patient info (if available)
        currentY = this.addPatientInfo(pdf, currentY, margin, contentWidth);

        // Add ECG analysis results
        currentY = this.addECGResults(pdf, result, currentY, margin, contentWidth);

        // Add probabilities chart
        if (includeCharts && result.probabilities) {
          currentY = this.addProbabilitiesChart(pdf, result.probabilities, currentY, margin, contentWidth, pageHeight);
        }

        // Add detailed analysis
        if (includeDetailedAnalysis) {
          currentY = this.addDetailedAnalysis(pdf, result, currentY, margin, contentWidth, pageHeight);
        }

        // Add clinical recommendations
        if (includeClinicalRecommendations) {
          currentY = this.addClinicalRecommendations(pdf, result, currentY, margin, contentWidth, pageHeight);
        }

        // Add footer
        this.addPDFFooter(pdf, pageHeight, margin, contentWidth);

        // Save the PDF
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

  // PDF generation helper methods
  private addPDFHeader(pdf: jsPDF, currentY: number, margin: number, contentWidth: number): number {
    // Main title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(50, 184, 198);
    pdf.text('ECG Analysis Report', margin, currentY);
    currentY += 15;

    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Automated ECG Classification Analysis', margin, currentY);
    currentY += 10;

    // Date and time
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    const now = new Date();
    pdf.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, margin, currentY);
    currentY += 15;

    // Add a line separator
    pdf.setDrawColor(50, 184, 198);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, margin + contentWidth, currentY);
    currentY += 10;

    return currentY;
  }

  private addPatientInfo(pdf: jsPDF, currentY: number, margin: number, contentWidth: number): number {
    const selectedPatientName = this.getSelectedPatientName();

    if (selectedPatientName) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Patient Information', margin, currentY);
      currentY += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Patient: ${selectedPatientName}`, margin + 5, currentY);
      currentY += 6;

      const patientId = this.uploadForm.get('patientId')?.value;
      if (patientId) {
        pdf.text(`Patient ID: ${patientId}`, margin + 5, currentY);
        currentY += 10;
      }
    }

    return currentY;
  }

  private addECGResults(pdf: jsPDF, result: ECGResult, currentY: number, margin: number, contentWidth: number): number {
    // Results section title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Analysis Results', margin, currentY);
    currentY += 10;

    // File information
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`File: ${result.fileName || 'N/A'}`, margin + 5, currentY);
    currentY += 6;

    if (result.timestamp) {
      pdf.text(`Analysis Date: ${new Date(result.timestamp).toLocaleString()}`, margin + 5, currentY);
      currentY += 6;
    }

    pdf.text(`Model: ${result.model || 'N/A'}`, margin + 5, currentY);
    currentY += 10;

    // Classification result box
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, currentY, contentWidth, 25, 'F');

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Classification:', margin + 5, currentY + 8);

    // Classification value with color coding
    const classification = result.classification || 'N/A';
    const classificationColor = this.getClassificationPDFColor(classification);
    pdf.setTextColor(classificationColor.r, classificationColor.g, classificationColor.b);
    pdf.setFontSize(14);
    pdf.text(classification, margin + 35, currentY + 8);

    // Confidence
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Confidence:', margin + 5, currentY + 18);

    const confidence = result.confidence !== undefined ? `${result.confidence.toFixed(1)}%` : 'N/A';
    pdf.setTextColor(50, 184, 198);
    pdf.text(confidence, margin + 35, currentY + 18);

    currentY += 35;

    // Description
    if (result.description) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      const description = result.description;
      const splitDescription = pdf.splitTextToSize(description, contentWidth - 10);
      pdf.text(splitDescription, margin + 5, currentY);
      currentY += splitDescription.length * 5 + 10;
    }

    return currentY;
  }

  private addProbabilitiesChart(pdf: jsPDF, probabilities: { [key: string]: number }, currentY: number, margin: number, contentWidth: number, pageHeight: number): number {
    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Classification Probabilities', margin, currentY);
    currentY += 15;

    const chartHeight = 60;
    const chartWidth = contentWidth;
    const barHeight = 8;
    const barSpacing = 12;

    // Draw probabilities as horizontal bars
    Object.entries(probabilities).forEach(([key, value], index) => {
      const barY = currentY + (index * barSpacing);
      const barWidth = (value / 100) * (chartWidth - 60);

      // Label
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(key, margin, barY + 5);

      // Background bar
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin + 25, barY, chartWidth - 60, barHeight, 'F');

      // Value bar with color
      const barColor = this.getProbabilityBarColor(key);
      pdf.setFillColor(barColor.r, barColor.g, barColor.b);
      pdf.rect(margin + 25, barY, barWidth, barHeight, 'F');

      // Percentage text
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${value.toFixed(1)}%`, margin + chartWidth - 30, barY + 5);
    });

    currentY += Object.keys(probabilities).length * barSpacing + 15;
    return currentY;
  }

  private addDetailedAnalysis(pdf: jsPDF, result: ECGResult, currentY: number, margin: number, contentWidth: number, pageHeight: number): number {
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Detailed Analysis', margin, currentY);
    currentY += 10;

    // Confidence level
    if (result.confidence_level) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Confidence Level: ${result.confidence_level}`, margin + 5, currentY);
      currentY += 8;
    }

    // Model information
    if (result.model_info) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Model Type: ${result.model_info['model_type'] || 'N/A'}`, margin + 5, currentY);
      currentY += 5;
      pdf.text(`Prediction Method: ${result.model_info['prediction_method'] || 'N/A'}`, margin + 5, currentY);
      currentY += 10;
    }

    return currentY;
  }

  private addClinicalRecommendations(pdf: jsPDF, result: ECGResult, currentY: number, margin: number, contentWidth: number, pageHeight: number): number {
    // Check if we need a new page
    if (currentY > pageHeight - 40) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Clinical Recommendations', margin, currentY);
    currentY += 10;

    if (result.clinical_recommendation) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      const recommendation = result.clinical_recommendation;
      const splitRecommendation = pdf.splitTextToSize(recommendation, contentWidth - 10);
      pdf.text(splitRecommendation, margin + 5, currentY);
      currentY += splitRecommendation.length * 5 + 10;
    }

    // Add general disclaimer
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(120, 120, 120);
    const disclaimer = 'Disclaimer: This automated analysis is for educational purposes and should not replace professional medical diagnosis. Always consult with a qualified healthcare provider for medical decisions.';
    const splitDisclaimer = pdf.splitTextToSize(disclaimer, contentWidth - 10);
    pdf.text(splitDisclaimer, margin + 5, currentY);
    currentY += splitDisclaimer.length * 4 + 10;

    return currentY;
  }

  private addPDFFooter(pdf: jsPDF, pageHeight: number, margin: number, contentWidth: number): void {
    const footerY = pageHeight - 15;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);

    // Left side - system info
    pdf.text('Generated by ECG Analysis System', margin, footerY);

    // Right side - page number
    const pageNum = `Page ${pdf.getCurrentPageInfo().pageNumber}`;
    const pageNumWidth = pdf.getTextWidth(pageNum);
    pdf.text(pageNum, margin + contentWidth - pageNumWidth, footerY);
  }

  private getClassificationPDFColor(classification: string): { r: number, g: number, b: number } {
    const colors = {
      'NORM': { r: 34, g: 197, b: 94 },   // Green
      'MI': { r: 239, g: 68, b: 68 },     // Red
      'STTC': { r: 251, g: 191, b: 36 },  // Yellow
      'CD': { r: 251, g: 191, b: 36 },    // Yellow
      'HYP': { r: 50, g: 184, b: 198 }    // Cyan
    };
    return colors[classification as keyof typeof colors] || { r: 100, g: 100, b: 100 };
  }

  private getProbabilityBarColor(classification: string): { r: number, g: number, b: number } {
    const colors = {
      'NORM': { r: 34, g: 197, b: 94 },
      'MI': { r: 239, g: 68, b: 68 },
      'STTC': { r: 251, g: 191, b: 36 },
      'CD': { r: 168, g: 85, b: 247 },
      'HYP': { r: 50, g: 184, b: 198 }
    };
    return colors[classification as keyof typeof colors] || { r: 156, g: 163, b: 175 };
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

  saveToPatientRecord(result: ECGResult): void {
    if (result.id == null) {
      this.notificationService.showError('Cannot save: result ID is missing.');
      return;
    }

    this.ecgService.saveToPatientRecord(String(result.id)).subscribe({
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

  showAddPatientModal(): void {
    // Implementation for showing add patient modal
    console.log('Show add patient modal');
  }

  // Add keyboard event listener for modal
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showPDFOptionsModal) {
      this.closePDFOptions();
    }
  }
}
