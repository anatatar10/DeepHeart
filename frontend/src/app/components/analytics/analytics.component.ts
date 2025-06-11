import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { AnalyticsService, AnalyticsData, ClassificationDistribution, WeeklyTrends, ModelPerformance } from '../../services/analytics.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('distributionChart') distributionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendsChart') trendsChartRef!: ElementRef<HTMLCanvasElement>;

  analyticsData: AnalyticsData | null = null;
  distributionChart: Chart | null = null;
  trendsChart: Chart | null = null;
  loading = true;
  error: string | null = null;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  public loadAnalyticsData(): void {
    this.loading = true;
    this.error = null;

    this.analyticsService.getAnalyticsData().subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.loading = false;
        setTimeout(() => {
          this.initializeCharts();
        }, 0);
      },
      error: (err) => {
        console.error('Failed to load analytics data:', err);
        this.error = 'Failed to load analytics data. Please try again.';
        this.loading = false;
        // Load mock data for demo purposes
        this.loadMockData();
      }
    });
  }

  private loadMockData(): void {
    // Fallback mock data for demo
    this.analyticsData = {
      classificationDistribution: {
        NORM: 45,
        MI: 18,
        STTC: 15,
        CD: 12,
        HYP: 10
      },
      weeklyTrends: [
        { date: '2025-06-03', uploads: 12 },
        { date: '2025-06-04', uploads: 19 },
        { date: '2025-06-05', uploads: 23 },
        { date: '2025-06-06', uploads: 17 },
        { date: '2025-06-07', uploads: 28 },
        { date: '2025-06-08', uploads: 15 },
        { date: '2025-06-09', uploads: 22 }
      ],
      modelPerformance: {
        accuracy: 94.2,
        auc: 95.6,
        sensitivity: 91.8,
        specificity: 93.4,
        lastUpdated: '2025-06-01T00:00:00'
      },
      totalProcessedThisMonth: 1247,
      averageProcessingTime: 2.3
    };

    setTimeout(() => {
      this.initializeCharts();
    }, 0);
  }

  private initializeCharts(): void {
    if (!this.analyticsData) return;

    this.createDistributionChart();
    this.createTrendsChart();
  }

  private createDistributionChart(): void {
    if (!this.distributionChartRef || !this.analyticsData) return;

    const ctx = this.distributionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.analyticsData.classificationDistribution;

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: ['Normal (NORM)', 'Myocardial Infarction (MI)', 'ST/T Changes (STTC)', 'Conduction Disturbance (CD)', 'Hypertrophy (HYP)'],
        datasets: [{
          data: [data.NORM, data.MI, data.STTC, data.CD, data.HYP],
          backgroundColor: [
            '#22C55E', // Green for NORM
            '#EF4444', // Red for MI
            '#F59E0B', // Amber for STTC
            '#8B5CF6', // Purple for CD
            '#06B6D4'  // Cyan for HYP
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((acc: number, val) => {
                  if (typeof val === 'number') {
                    return acc + val;
                  }
                  return acc;
                }, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.distributionChart = new Chart(ctx, config);
  }

  private createTrendsChart(): void {
    if (!this.trendsChartRef || !this.analyticsData) return;

    const ctx = this.trendsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const trends = this.analyticsData.weeklyTrends;
    const labels = trends.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const data = trends.map(t => t.uploads);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'ECG Uploads',
          data: data,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.trendsChart = new Chart(ctx, config);
  }

  exportAnalyticsReport(): void {
    this.analyticsService.exportAnalyticsReport().subscribe({
      next: (blob) => {
        this.downloadFile(blob, 'analytics-report.pdf');
      },
      error: (err) => {
        console.error('Failed to export analytics report:', err);
        alert('Failed to export report. Please try again.');
      }
    });
  }

  exportPatientData(): void {
    this.analyticsService.exportPatientData().subscribe({
      next: (blob) => {
        this.downloadFile(blob, 'patient-data.xlsx');
      },
      error: (err) => {
        console.error('Failed to export patient data:', err);
        alert('Failed to export patient data. Please try again.');
      }
    });
  }

  exportModelPerformance(): void {
    if (!this.analyticsData) return;

    const data = JSON.stringify(this.analyticsData.modelPerformance, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    this.downloadFile(blob, 'model-performance.json');
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  formatLastUpdated(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getClassificationColor(classification: string): string {
    const colors: { [key: string]: string } = {
      'NORM': '#22C55E',
      'MI': '#EF4444',
      'STTC': '#F59E0B',
      'CD': '#8B5CF6',
      'HYP': '#06B6D4'
    };
    return colors[classification] || '#6B7280';
  }

  ngOnDestroy(): void {
    if (this.distributionChart) {
      this.distributionChart.destroy();
    }
    if (this.trendsChart) {
      this.trendsChart.destroy();
    }
  }

  // Add this method to analytics.component.ts
  getClassificationItems() {
    if (!this.analyticsData) return [];

    const distribution = this.analyticsData.classificationDistribution;
    const total = distribution.NORM + distribution.MI + distribution.STTC + distribution.CD + distribution.HYP;

    const items = [
      { key: 'NORM', name: 'Normal (NORM)', value: distribution.NORM },
      { key: 'MI', name: 'Myocardial Infarction (MI)', value: distribution.MI },
      { key: 'STTC', name: 'ST/T Changes (STTC)', value: distribution.STTC },
      { key: 'CD', name: 'Conduction Disturbance (CD)', value: distribution.CD },
      { key: 'HYP', name: 'Hypertrophy (HYP)', value: distribution.HYP }
    ];

    return items.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
    }));
  }
}
