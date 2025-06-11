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

    public ClassificationDistributionDTO getClassificationDistribution() {
        return classificationDistribution;
    }

    public void setClassificationDistribution(ClassificationDistributionDTO classificationDistribution) {
        this.classificationDistribution = classificationDistribution;
    }

    public List<WeeklyTrendsDTO> getWeeklyTrends() {
        return weeklyTrends;
    }

    public void setWeeklyTrends(List<WeeklyTrendsDTO> weeklyTrends) {
        this.weeklyTrends = weeklyTrends;
    }

    public ModelPerformanceDTO getModelPerformance() {
        return modelPerformance;
    }

    public void setModelPerformance(ModelPerformanceDTO modelPerformance) {
        this.modelPerformance = modelPerformance;
    }

    public long getTotalProcessedThisMonth() {
        return totalProcessedThisMonth;
    }

    public void setTotalProcessedThisMonth(long totalProcessedThisMonth) {
        this.totalProcessedThisMonth = totalProcessedThisMonth;
    }

    public double getAverageProcessingTime() {
        return averageProcessingTime;
    }

    public void setAverageProcessingTime(double averageProcessingTime) {
        this.averageProcessingTime = averageProcessingTime;
    }
}