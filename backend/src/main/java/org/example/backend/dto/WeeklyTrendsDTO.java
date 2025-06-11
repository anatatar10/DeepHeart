package org.example.backend.dto;

public class WeeklyTrendsDTO {
    private String date;
    private long uploads;

    public WeeklyTrendsDTO() {}

    public WeeklyTrendsDTO(String date, long uploads) {
        this.date = date;
        this.uploads = uploads;
    }

    // Getters and setters
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public long getUploads() { return uploads; }
    public void setUploads(long uploads) { this.uploads = uploads; }
}