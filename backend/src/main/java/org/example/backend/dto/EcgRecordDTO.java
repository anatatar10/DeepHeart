package org.example.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class EcgRecordDTO {
    private UUID id;
    private UUID patientId;
    private String fileName;
    private String status;
    private LocalDateTime uploadTimestamp;

    private double normProbability;
    private double miProbability;
    private double sttcProbability;
    private double cdProbability;
    private double hypProbability;

    public EcgRecordDTO() {}

    // Getters & Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPatientId() { return patientId; }
    public void setPatientId(UUID patientId) { this.patientId = patientId; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getUploadTimestamp() { return uploadTimestamp; }
    public void setUploadTimestamp(LocalDateTime uploadTimestamp) { this.uploadTimestamp = uploadTimestamp; }

    public double getNormProbability() { return normProbability; }
    public void setNormProbability(double normProbability) { this.normProbability = normProbability; }

    public double getMiProbability() { return miProbability; }
    public void setMiProbability(double miProbability) { this.miProbability = miProbability; }

    public double getSttcProbability() { return sttcProbability; }
    public void setSttcProbability(double sttcProbability) { this.sttcProbability = sttcProbability; }

    public double getCdProbability() { return cdProbability; }
    public void setCdProbability(double cdProbability) { this.cdProbability = cdProbability; }

    public double getHypProbability() { return hypProbability; }
    public void setHypProbability(double hypProbability) { this.hypProbability = hypProbability; }
}