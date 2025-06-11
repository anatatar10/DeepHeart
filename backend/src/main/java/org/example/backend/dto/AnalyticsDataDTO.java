// AnalyticsDataDTO.java
package org.example.backend.dto;

import java.util.List;

public class AnalyticsDataDTO {
    private ClassificationDistributionDTO classificationDistribution;
    private List<WeeklyTrendsDTO> weeklyTrends;
    private ModelPerformanceDTO modelPerformance;
    private long totalProcessedThisMonth;
    private double averageProcessingTime;

    public AnalyticsDataDTO() {}

    public AnalyticsDataDTO(ClassificationDistributionDTO classificationDistribution,
                            List<WeeklyTrendsDTO> weeklyTrends,
                            ModelPerformanceDTO modelPerformance,
                            long totalProcessedThisMonth,
                            double averageProcessingTime) {
        this.classificationDistribution = classificationDistribution;
        this.weeklyTrends = weeklyTrends;
        this.modelPerformance = modelPerformance;
        this.totalProcessedThisMonth = totalProcessedThisMonth;
        this.averageProcessingTime = averageProcessingTime;
    }

    // Getters and setters
    public ClassificationDistributionDTO getClassificationDistribution() { return classificationDistribution; }
    public void setClassificationDistribution(ClassificationDistributionDTO classificationDistribution) { this.classificationDistribution = classificationDistribution; }

    public List<WeeklyTrendsDTO> getWeeklyTrends() { return weeklyTrends; }
    public void setWeeklyTrends(List<WeeklyTrendsDTO> weeklyTrends) { this.weeklyTrends = weeklyTrends; }

    public ModelPerformanceDTO getModelPerformance() { return modelPerformance; }
    public void setModelPerformance(ModelPerformanceDTO modelPerformance) { this.modelPerformance = modelPerformance; }

    public long getTotalProcessedThisMonth() { return totalProcessedThisMonth; }
    public void setTotalProcessedThisMonth(long totalProcessedThisMonth) { this.totalProcessedThisMonth = totalProcessedThisMonth; }

    public double getAverageProcessingTime() { return averageProcessingTime; }
    public void setAverageProcessingTime(double averageProcessingTime) { this.averageProcessingTime = averageProcessingTime; }
}

// ClassificationDistributionDTO.java
package org.example.backend.dto;

public class ClassificationDistributionDTO {
    private long norm;
    private long mi;
    private long sttc;
    private long cd;
    private long hyp;

    public ClassificationDistributionDTO() {}

    public ClassificationDistributionDTO(long norm, long mi, long sttc, long cd, long hyp) {
        this.norm = norm;
        this.mi = mi;
        this.sttc = sttc;
        this.cd = cd;
        this.hyp = hyp;
    }

    // Getters and setters
    public long getNorm() { return norm; }
    public void setNorm(long norm) { this.norm = norm; }

    public long getMi() { return mi; }
    public void setMi(long mi) { this.mi = mi; }

    public long getSttc() { return sttc; }
    public void setSttc(long sttc) { this.sttc = sttc; }

    public long getCd() { return cd; }
    public void setCd(long cd) { this.cd = cd; }

    public long getHyp() { return hyp; }
    public void setHyp(long hyp) { this.hyp = hyp; }
}

// WeeklyTrendsDTO.java
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

// ModelPerformanceDTO.java
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