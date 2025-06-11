package org.example.backend.dto;

public class DashboardStatsDTO {
    private long totalUploads;
    private long totalPatients;
    private long todaysUploads;

    public DashboardStatsDTO(long totalUploads, long totalPatients, long todaysUploads) {
        this.totalUploads = totalUploads;
        this.totalPatients = totalPatients;
        this.todaysUploads = todaysUploads;
    }

    public long getTotalUploads() {
        return totalUploads;
    }

    public long getTotalPatients() {
        return totalPatients;
    }

    public long getTodaysUploads() {
        return todaysUploads;
    }

}