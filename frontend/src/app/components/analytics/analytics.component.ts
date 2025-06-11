import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  PieController,
  LineController
} from 'chart.js';
import { AnalyticsService, AnalyticsData, ClassificationDistribution, WeeklyTrends, ModelPerformance } from '../../services/analytics.service';

// Register Chart.js components explicitly including controllers
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  PieController,
  LineController
);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('distributionChart') distributionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendsChart') trendsChartRef!: ElementRef<HTMLCanvasElement>;

  analyticsData: AnalyticsData | null = null;
  distributionChart: Chart | null = null;
  trendsChart: Chart | null = null;
  loading = true;
  error: string | null = null;
  lastRefreshTime: string = new Date().toLocaleTimeString();

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    // Load real data first, with fallback handling for zero values
    this.loadAnalyticsData();
  }

  ngAfterViewInit(): void {
    console.log('AfterViewInit called');
    // Auto-initialize charts when view is ready
    setTimeout(() => {
      if (this.analyticsData) {
        console.log('Auto-initializing charts from AfterViewInit...');
        this.safeInitializeCharts();
      }
    }, 1000);
  }

  public loadAnalyticsData(): void {
    this.loading = true;
    this.error = null;

    this.analyticsService.getAnalyticsData().subscribe({
      next: (data) => {
        console.log('Analytics data loaded:', data);
        this.analyticsData = data;
        this.loading = false;
        this.lastRefreshTime = new Date().toLocaleTimeString();

        // Automatically initialize charts when real data loads
        console.log('Auto-initializing charts with real data...');
        setTimeout(() => {
          this.safeInitializeCharts();
        }, 500);
      },
      error: (err) => {
        console.error('Failed to load analytics data:', err);
        this.error = 'Failed to load analytics data. Please try again.';
        this.loading = false;
        this.loadMockData();
      }
    });
  }

  private loadMockData(): void {
    console.log('Loading mock data...');
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

    this.lastRefreshTime = new Date().toLocaleTimeString();
    this.loading = false;

    // Now auto-initialize charts when data loads
    setTimeout(() => {
      this.safeInitializeCharts();
    }, 500);
  }

  // Debug method to check what elements exist
  debugElements(): void {
    console.log('=== DEBUG ELEMENTS ===');
    console.log('Analytics data exists:', !!this.analyticsData);
    console.log('ViewChild distributionChartRef:', this.distributionChartRef);
    console.log('ViewChild trendsChartRef:', this.trendsChartRef);

    const byId1 = document.getElementById('distributionChart');
    const byId2 = document.getElementById('trendsChart');
    const byQuery1 = document.querySelector('canvas[data-chart="distribution"]');
    const byQuery2 = document.querySelector('canvas[data-chart="trends"]');

    console.log('getElementById distributionChart:', byId1);
    console.log('getElementById trendsChart:', byId2);
    console.log('querySelector distribution:', byQuery1);
    console.log('querySelector trends:', byQuery2);
    console.log('All canvas elements:', document.querySelectorAll('canvas'));

    // Show actual data content
    if (this.analyticsData) {
      console.log('=== ACTUAL DATA CONTENT ===');
      console.log('Classification Distribution:', this.analyticsData.classificationDistribution);
      console.log('- NORM:', this.analyticsData.classificationDistribution.NORM);
      console.log('- MI:', this.analyticsData.classificationDistribution.MI);
      console.log('- STTC:', this.analyticsData.classificationDistribution.STTC);
      console.log('- CD:', this.analyticsData.classificationDistribution.CD);
      console.log('- HYP:', this.analyticsData.classificationDistribution.HYP);
      console.log('Weekly Trends:', this.analyticsData.weeklyTrends);
      console.log('Model Performance:', this.analyticsData.modelPerformance);
      console.log('Total Processed This Month:', this.analyticsData.totalProcessedThisMonth);
      console.log('Average Processing Time:', this.analyticsData.averageProcessingTime);
    } else {
      console.log('No analytics data available');
    }
    console.log('======================');
  }

  // Safe manual initialization - no loops
  safeInitializeCharts(): void {
    console.log('=== SAFE MANUAL CHART INITIALIZATION ===');

    // Step 1: Check if we have data
    if (!this.analyticsData) {
      console.log('No data found, loading mock data...');
      this.loadMockDataSync();
    }

    // Step 2: Find canvas elements
    console.log('Looking for canvas elements...');
    const distributionCanvas = document.getElementById('distributionChart') as HTMLCanvasElement;
    const trendsCanvas = document.getElementById('trendsChart') as HTMLCanvasElement;

    console.log('Distribution canvas found:', !!distributionCanvas);
    console.log('Trends canvas found:', !!trendsCanvas);

    if (!distributionCanvas) {
      console.error('❌ Distribution canvas not found!');
      return;
    }

    if (!trendsCanvas) {
      console.error('❌ Trends canvas not found!');
      return;
    }

    // Step 3: Create charts (no retries, no loops)
    try {
      console.log('Creating distribution chart...');
      this.createDistributionChartDirect(distributionCanvas);
      console.log('✅ Distribution chart created');

      console.log('Creating trends chart...');
      this.createTrendsChartDirect(trendsCanvas);
      console.log('✅ Trends chart created');

      console.log('🎉 All charts created successfully!');
    } catch (error) {
      console.error('❌ Error creating charts:', error);
    }
  }

  // Load mock data synchronously without triggering chart initialization
  loadMockDataSync(): void {
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
    this.lastRefreshTime = new Date().toLocaleTimeString();
    console.log('Mock data loaded successfully');
  }

  private createDistributionChartDirect(canvas: HTMLCanvasElement): void {
    console.log('Creating distribution chart with direct canvas...');

    if (!this.analyticsData) {
      console.error('No analytics data for distribution chart');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    // IMPORTANT: Destroy ALL existing charts on this canvas
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      console.log('Destroying existing chart on canvas');
      existingChart.destroy();
    }

    if (this.distributionChart) {
      console.log('Destroying stored distribution chart reference');
      this.distributionChart.destroy();
      this.distributionChart = null;
    }

    const data = this.analyticsData.classificationDistribution;
    console.log('Pie chart data object:', data);

    // Handle the actual data structure (lowercase keys from API)
    const chartData = [
      (data as any).norm || data.NORM || 0,
      (data as any).mi || data.MI || 0,
      (data as any).sttc || data.STTC || 0,
      (data as any).cd || data.CD || 0,
      (data as any).hyp || data.HYP || 0
    ];

    console.log('Processed chart data array:', chartData);

    // Check if we have any meaningful data
    const totalData = chartData.reduce((sum, val) => sum + val, 0);
    console.log('Total data sum:', totalData);

    let finalChartData = chartData;
    let finalLabels = ['Normal (NORM)', 'Myocardial Infarction (MI)', 'ST/T Changes (STTC)', 'Conduction Disturbance (CD)', 'Hypertrophy (HYP)'];
    let finalColors = ['#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4'];

    // If no real data, show a "No Data Available" placeholder
    if (totalData === 0) {
      console.log('No real data available, showing placeholder...');
      finalChartData = [1]; // Single segment for "No Data"
      finalLabels = ['No Data Available'];
      finalColors = ['#6B7280']; // Gray color
    } else {
      console.log('Found real data, creating pie chart with actual values');
    }

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: finalLabels,
        datasets: [{
          data: finalChartData,
          backgroundColor: finalColors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: 20
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              color: '#ffffff',
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#32B8C6',
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;

                // Special handling for "No Data" case
                if (totalData === 0) {
                  return 'No classification data available yet';
                }

                const total = context.dataset.data.reduce((acc: number, val) => {
                  return acc + (typeof val === 'number' ? val : 0);
                }, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        elements: {
          arc: {
            borderWidth: 2
          }
        }
      }
    };

    try {
      console.log('Creating pie chart with final config...');
      this.distributionChart = new Chart(ctx, config);
      console.log('✅ Distribution chart created successfully');
    } catch (error) {
      console.error('❌ Error creating distribution chart:', error);
    }
  }

  private createTrendsChartDirect(canvas: HTMLCanvasElement): void {
    console.log('Creating trends chart with direct canvas...');

    if (!this.analyticsData) {
      console.error('No analytics data for trends chart');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get trends canvas context');
      return;
    }

    // IMPORTANT: Destroy ALL existing charts on this canvas
    // Get chart instance if it exists
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      console.log('Destroying existing chart on trends canvas');
      existingChart.destroy();
    }

    // Also destroy our stored reference
    if (this.trendsChart) {
      console.log('Destroying stored trends chart reference');
      this.trendsChart.destroy();
      this.trendsChart = null;
    }

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
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#ffffff'
            }
          }
        }
      }
    };

    try {
      this.trendsChart = new Chart(ctx, config);
      console.log('✅ Trends chart created successfully');
    } catch (error) {
      console.error('❌ Error creating trends chart:', error);
    }
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
    console.log('Destroying charts...');
    if (this.distributionChart) {
      this.distributionChart.destroy();
    }
    if (this.trendsChart) {
      this.trendsChart.destroy();
    }
  }

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

  get currentTime(): string {
    return new Date().toLocaleTimeString();
  }
}
