package org.example.backend.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "predictions")
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ecg_record_id", nullable = false)
    private EcgRecord ecgRecord;

    @Column(name = "class_name", nullable = false)
    private String className; // e.g., NORM, MI, STTC, CD, HYP

    @Column(nullable = false)
    private double confidence;

    @Column(name = "model_name")
    private String modelName; // e.g., DenseNet121, ResNet50

    @Column(name = "heatmap_path")
    private String heatmapPath; // Optional path to Grad-CAM image

    // Constructors
    public Prediction() {}

    public Prediction(EcgRecord ecgRecord, String className, double confidence, String modelName, String heatmapPath) {
        this.ecgRecord = ecgRecord;
        this.className = className;
        this.confidence = confidence;
        this.modelName = modelName;
        this.heatmapPath = heatmapPath;
    }

    // Getters and setters
    public UUID getId() { return id; }

    public EcgRecord getEcgRecord() { return ecgRecord; }
    public void setEcgRecord(EcgRecord ecgRecord) { this.ecgRecord = ecgRecord; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getHeatmapPath() { return heatmapPath; }
    public void setHeatmapPath(String heatmapPath) { this.heatmapPath = heatmapPath; }
}
