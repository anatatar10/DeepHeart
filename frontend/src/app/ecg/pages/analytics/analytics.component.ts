import { Component } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  imports: [CommonModule, NgChartsModule]  // <--- this must be valid now
})

export class AnalyticsComponent {
  pieChartLabels: string[] = ['NORM', 'MI', 'STTC', 'CD', 'HYP'];
  pieChartData = {
    labels: this.pieChartLabels,
    datasets: [
      {
        label: 'Predictions',
        data: [40, 25, 15, 10, 10],
        backgroundColor: ['#60a5fa', '#f87171', '#facc15', '#34d399', '#818cf8']
      }
    ]
  };

  barChartLabels: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  barChartData = {
    labels: this.barChartLabels,
    datasets: [
      {
        label: 'Uploads',
        data: [10, 15, 8, 12, 20],
        backgroundColor: '#3b82f6'
      }
    ]
  };
}
