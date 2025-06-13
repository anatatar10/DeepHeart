import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ECGService } from '../../services/ecg.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { EcgRecordDTO } from '../../models/ecg-record.dto';

@Component({
  selector: 'app-ecg-history',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterModule],
  templateUrl: './ecg-history.component.html',
  styleUrls: ['./ecg-history.component.scss']
})
export class EcgHistoryComponent implements OnInit {

  ecgRecords: EcgRecordDTO[] = [];
  filteredRecords: EcgRecordDTO[] = [];
  loading = true;
  error = false;
  currentUser: any = null;
  expandedRecord: string | null = null;

  searchTerm: string = '';
  filterClassification: string = '';
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  totalRecords: number = 0;

  classificationLabels: { [key: string]: string } = {
    'NORM': 'Normal',
    'STTC': 'ST/T Changes',
    'MI': 'Myocardial Infarction',
    'CD': 'Conduction Disorder',
    'HYP': 'Hypertrophy'
  };

  recommendationsMap: { [key: string]: string[] } = {
    NORM: ['Continue regular check-ups', 'Maintain healthy lifestyle'],
    STTC: ['Further cardiac evaluation recommended', 'Monitor symptoms closely', 'Consider stress testing'],
    MI: ['Immediate cardiology consultation', 'Emergency evaluation if symptomatic', 'Cardiac catheterization may be needed'],
    CD: ['Electrophysiology consultation', 'Consider pacemaker evaluation', 'Monitor heart rhythm'],
    HYP: ['Blood pressure management', 'Echocardiogram recommended', 'Lifestyle modifications'],
  };

  // Add the missing private properties
  private classificationDescriptions: { [key: string]: string } = {
    'NORM': 'Normal ECG with no significant abnormalities detected.',
    'STTC': 'ST/T wave changes observed, may indicate ischemia or other cardiac conditions.',
    'MI': 'Signs consistent with myocardial infarction (heart attack).',
    'CD': 'Conduction disorders affecting electrical impulse transmission.',
    'HYP': 'Cardiac hypertrophy indicating enlarged heart chambers.'
  };

  private classificationColors: { [key: string]: string } = {
    'NORM': 'linear-gradient(90deg, rgba(34, 197, 94, 1), rgba(34, 197, 94, 0.8))',
    'STTC': 'linear-gradient(90deg, rgba(230, 129, 97, 1), rgba(230, 129, 97, 0.8))',
    'MI': 'linear-gradient(90deg, rgba(255, 84, 89, 1), rgba(255, 84, 89, 0.8))',
    'CD': 'linear-gradient(90deg, rgba(139, 92, 246, 1), rgba(139, 92, 246, 0.8))',
    'HYP': 'linear-gradient(90deg, rgba(168, 85, 247, 1), rgba(168, 85, 247, 0.8))'
  };

  constructor(
    private ecgService: ECGService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('auth_user');
    this.currentUser = userStr ? JSON.parse(userStr) : null;

    if (this.currentUser?.id) {
      this.loadEcgHistory();
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  loadEcgHistory(): void {
    this.loading = true;
    this.error = false;

    this.ecgService.getPatientECGRecords(this.currentUser.id).subscribe({
      next: (records: EcgRecordDTO[]) => {
        this.ecgRecords = records;
        this.totalRecords = records.length;
        this.calculatePagination();
        this.filterRecords();
        this.loading = false;
      },
      error: () => {
        this.notificationService.showError('Failed to load ECG history');
        this.error = true;
        this.loading = false;
      }
    });
  }

  filterRecords(): void {
    let filtered = [...this.ecgRecords];

    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.fileName.toLowerCase().includes(searchLower) ||
        record.classification.toLowerCase().includes(searchLower) ||
        this.getClassificationLabel(record.classification).toLowerCase().includes(searchLower)
      );
    }

    if (this.filterClassification) {
      filtered = filtered.filter(record => record.classification === this.filterClassification);
    }

    if (this.sortField) {
      filtered.sort((a, b) => {
        let aValue: any = a[this.sortField as keyof EcgRecordDTO];
        let bValue: any = b[this.sortField as keyof EcgRecordDTO];

        if (this.sortField === 'uploadTimestamp') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        return this.sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }

    this.filteredRecords = filtered;
    this.totalRecords = filtered.length;
    this.calculatePagination();

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.filterRecords();
  }

  getRecommendations(code: string): string[] {
    return this.recommendationsMap[code] ?? [];
  }

  getSortClass(field: string): string {
    return this.sortField === field ? this.sortDirection : '';
  }

  toggleExpand(recordId: string): void {
    this.expandedRecord = this.expandedRecord === recordId ? null : recordId;
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStartRecord(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
  }

  getClassificationLabel(code: string): string {
    return this.classificationLabels[code] ?? code;
  }

  // NEW METHODS - Add these inside the class
  getClassificationClass(classification: string): string {
    return classification.toLowerCase();
  }

  getClassificationDescription(classification: string): string {
    return this.classificationDescriptions[classification] || 'No description available.';
  }

  getClassificationRecommendations(classification: string): string[] | null {
    return this.recommendationsMap[classification] || null;
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  }

  getStatusClass(status: string): string {
    if (status.toLowerCase().includes('saved')) return 'saved';
    if (status.toLowerCase().includes('pending')) return 'pending';
    if (status.toLowerCase().includes('failed')) return 'failed';
    return '';
  }

  getProbabilityColor(classification: string): string {
    return this.classificationColors[classification] || 'var(--color-primary)';
  }

  viewReport(record: EcgRecordDTO): void {
    console.log('Viewing report for:', record);
    this.notificationService.showSuccess('Opening report...');
  }

  downloadReport(record: EcgRecordDTO): void {
    console.log('Downloading report for:', record);
    this.notificationService.showSuccess('Downloading report...');

    try {
      const reportData = this.generateReportData(record);
      this.downloadFile(reportData, `ECG_Report_${record.fileName}.txt`);
    } catch (error) {
      this.notificationService.showError('Failed to download report');
    }
  }

  viewFullReport(record: EcgRecordDTO): void {
    console.log('Viewing full report for:', record);
    this.notificationService.showSuccess('Opening full report...');
  }

  downloadDetailedReport(record: EcgRecordDTO): void {
    console.log('Downloading detailed report for:', record);
    this.notificationService.showSuccess('Downloading detailed report...');

    try {
      const detailedReportData = this.generateDetailedReportData(record);
      this.downloadFile(detailedReportData, `ECG_Detailed_Report_${record.fileName}.txt`);
    } catch (error) {
      this.notificationService.showError('Failed to download detailed report');
    }
  }

  shareRecord(record: EcgRecordDTO): void {
    console.log('Sharing record:', record);

    const shareUrl = `${window.location.origin}/ecg-records/${record.id}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.notificationService.showSuccess('Record link copied to clipboard');
      }).catch(() => {
        this.notificationService.showError('Failed to copy link');
      });
    } else {
      this.notificationService.showError('Sharing not supported in this browser');
    }
  }

  canShare(record: EcgRecordDTO): boolean {
    return true; // Modify this logic based on your requirements
  }

  deleteRecord(record: EcgRecordDTO): void {
    if (confirm(`Are you sure you want to delete the record for ${record.fileName}?`)) {
      console.log('Deleting record:', record);

      this.notificationService.showSuccess('Deleting record...');

      // Remove from local arrays
      this.ecgRecords = this.ecgRecords.filter(r => r.id !== record.id);
      this.filterRecords();

      if (this.expandedRecord === record.id) {
        this.expandedRecord = null;
      }

      this.notificationService.showSuccess('Record deleted successfully');
    }
  }

  // Private helper methods
  private generateReportData(record: EcgRecordDTO): string {
    return `
ECG Analysis Report
==================

Patient ID: ${record.patientId}
File: ${record.fileName}
Analysis Date: ${new Date(record.timestamp).toLocaleString()}

Classification: ${this.getClassificationLabel(record.classification)}
Confidence: ${record.confidence.toFixed(1)}%

${record.description ? `Description: ${record.description}` : ''}

${record.probabilities ? `
Probabilities:
${Object.entries(record.probabilities)
      .map(([key, value]) => `${this.getClassificationLabel(key)}: ${(value as number).toFixed(1)}%`)
      .join('\n')}
` : ''}

Generated on: ${new Date().toLocaleString()}
    `.trim();
  }

  private generateDetailedReportData(record: EcgRecordDTO): string {
    const recommendations = this.getClassificationRecommendations(record.classification);

    return `
ECG Detailed Analysis Report
===========================

PATIENT INFORMATION
Patient ID: ${record.patientId}
Record ID: ${record.id}

FILE INFORMATION
File Name: ${record.fileName}
Analysis Date: ${new Date(record.timestamp).toLocaleString()}

CLASSIFICATION RESULTS
Primary Classification: ${this.getClassificationLabel(record.classification)}
Confidence Level: ${record.confidence.toFixed(2)}%
Confidence Category: ${this.getConfidenceClass(record.confidence).toUpperCase()}

${record.probabilities ? `
DETAILED PROBABILITIES
${Object.entries(record.probabilities)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .map(([key, value]) => `${this.getClassificationLabel(key).padEnd(25)}: ${(value as number).toFixed(2)}%`)
      .join('\n')}
` : ''}

CLINICAL INFORMATION
Description: ${record.description || 'No description available'}

Classification Details: ${this.getClassificationDescription(record.classification)}

${recommendations ? `
CLINICAL RECOMMENDATIONS
${recommendations.map(rec => `• ${rec}`).join('\n')}
` : ''}

REPORT METADATA
Generated on: ${new Date().toLocaleString()}
Report Type: Detailed Analysis
System: ECG Analysis Platform

---
This report is for medical professional use only.
Please consult with a qualified healthcare provider for medical interpretation.
    `.trim();
  }

  private downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
