package org.example.backend.dto;

import java.time.LocalDateTime;

public class ModelPerformanceDTO {
    private double accuracy;
    private double auc;
    private double sensitivity;
    private double specificity;
    private LocalDateTime lastUpdated;

    public ModelPerformanceDTO() {}

    public ModelPerformanceDTO(double accuracy, double auc, double sensitivity, double specificity, LocalDateTime lastUpdated) {
        this.accuracy = accuracy;
        this.auc = auc;
        this.sensitivity = sensitivity;
        this.specificity = specificity;
        this.lastUpdated = lastUpdated;
    }

    // Getters and setters
    public double getAccuracy() { return accuracy; }
    public void setAccuracy(double accuracy) { this.accuracy = accuracy; }

    public double getAuc() { return auc; }
    public void setAuc(double auc) { this.auc = auc; }

    public double getSensitivity() { return sensitivity; }
    public void setSensitivity(double sensitivity) { this.sensitivity = sensitivity; }

    public double getSpecificity() { return specificity; }
    public void setSpecificity(double specificity) { this.specificity = specificity; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}