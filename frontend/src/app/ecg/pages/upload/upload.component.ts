// File: src/app/ecg/pages/upload/upload.component.ts
import { Component } from '@angular/core';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // ✅ Add this

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],  // ✅ include RouterModule
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
  selectedFile: File | null = null;
  userId = 'f49a6dc2-5b15-4df1-bcd4-8bfb9f12d2c1';
  predictions: Record<string, number> | null = null;
  loading = false;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  upload() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('userId', this.userId);

    this.loading = true;

    this.http.post<{ [key: string]: number }>(
      'http://localhost:8080/api/ecg/upload',
      formData
    ).subscribe({
      next: (res) => {
        this.predictions = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.loading = false;
      }
    });
  }

  predictionKeys(): string[] {
    return this.predictions ? Object.keys(this.predictions) : [];
  }

  protected readonly document = document;
}
