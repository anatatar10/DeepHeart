package org.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ecg_records")
public class EcgRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Patient who owns this ECG record
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Doctor responsible for this ECG record
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private User doctor;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String status; // e.g., Pending / Processed / Failed

    @Column(name = "date_added", nullable = false)
    private LocalDateTime dateAdded;

    // Class probabilities
    @Column(name = "norm_prob")
    private double normProbability;

    @Column(name = "mi_prob")
    private double miProbability;

    @Column(name = "sttc_prob")
    private double sttcProbability;

    @Column(name = "cd_prob")
    private double cdProbability;

    @Column(name = "hyp_prob")
    private double hypProbability;

    // Constructor
    public EcgRecord() {}

    public EcgRecord(User user, User doctor, String filename, String status) {
        this.user = user;
        this.doctor = doctor;
        this.filename = filename;
        this.status = status;
        this.dateAdded = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.dateAdded = LocalDateTime.now();
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public User getDoctor() {
        return doctor;
    }

    public void setDoctor(User doctor) {
        this.doctor = doctor;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getDateAdded() {
        return dateAdded;
    }

    public void setDateAdded(LocalDateTime dateAdded) {
        this.dateAdded = dateAdded;
    }

    public double getNormProbability() {
        return normProbability;
    }

    public void setNormProbability(double normProbability) {
        this.normProbability = normProbability;
    }

    public double getMiProbability() {
        return miProbability;
    }

    public void setMiProbability(double miProbability) {
        this.miProbability = miProbability;
    }

    public double getSttcProbability() {
        return sttcProbability;
    }

    public void setSttcProbability(double sttcProbability) {
        this.sttcProbability = sttcProbability;
    }

    public double getCdProbability() {
        return cdProbability;
    }

    public void setCdProbability(double cdProbability) {
        this.cdProbability = cdProbability;
    }

    public double getHypProbability() {
        return hypProbability;
    }

    public void setHypProbability(double hypProbability) {
        this.hypProbability = hypProbability;
    }
}