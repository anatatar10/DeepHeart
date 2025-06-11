package org.example.backend.service;

import org.example.backend.dto.*;
import org.example.backend.model.EcgRecord;
import org.example.backend.model.User;
import org.example.backend.repository.EcgRecordRepository;
import org.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class AnalyticsService {

    private final EcgRecordRepository ecgRecordRepository;
    private final UserRepository userRepository;

    public AnalyticsService(EcgRecordRepository ecgRecordRepository, UserRepository userRepository) {
        this.ecgRecordRepository = ecgRecordRepository;
        this.userRepository = userRepository;
    }

    public AnalyticsDataDTO getDashboardAnalytics(String doctorEmail) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        // Get classification distribution
        ClassificationDistributionDTO distribution = getClassificationDistribution(doctorEmail);

        // Get weekly trends
        List<WeeklyTrendsDTO> trends = getWeeklyTrends(doctorEmail);

        // Get model performance
        ModelPerformanceDTO performance = getModelPerformance();

        // Calculate total processed this month
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        long totalThisMonth = ecgRecordRepository.countByDoctorAndDateAddedAfter(doctor, startOfMonth);

        // Average processing time (mock data for now)
        double averageProcessingTime = 2.3;

        return new AnalyticsDataDTO(distribution, trends, performance, totalThisMonth, averageProcessingTime);
    }

    public ClassificationDistributionDTO getClassificationDistribution(String doctorEmail) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        // Count records by classification based on highest probability
        // For now, using mock data since we need to implement classification logic
        // In a real implementation, you would analyze the probabilities to determine classification

        List<EcgRecord> allRecords = ecgRecordRepository.findByDoctor(doctor);

        long norm = 0, mi = 0, sttc = 0, cd = 0, hyp = 0;

        for (EcgRecord record : allRecords) {
            // Determine classification based on highest probability
            String classification = determineClassification(record);
            switch (classification) {
                case "NORM": norm++; break;
                case "MI": mi++; break;
                case "STTC": sttc++; break;
                case "CD": cd++; break;
                case "HYP": hyp++; break;
            }
        }

        // If no real data, provide sample data
        if (allRecords.isEmpty()) {
            norm = 45; mi = 18; sttc = 15; cd = 12; hyp = 10;
        }

        return new ClassificationDistributionDTO(norm, mi, sttc, cd, hyp);
    }

    public List<WeeklyTrendsDTO> getWeeklyTrends(String doctorEmail) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        List<WeeklyTrendsDTO> trends = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Get data for the last 7 days
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(23, 59, 59);

            long uploads = ecgRecordRepository.countByDoctorAndDateAddedBetween(doctor, startOfDay, endOfDay);
            trends.add(new WeeklyTrendsDTO(date.format(formatter), uploads));
        }

        return trends;
    }

    public ModelPerformanceDTO getModelPerformance() {
        // In a real implementation, these would come from your ML model evaluation
        return new ModelPerformanceDTO(
                94.2,  // accuracy
                95.6,  // auc
                91.8,  // sensitivity
                93.4,  // specificity
                LocalDateTime.of(2025, 6, 1, 0, 0) // lastUpdated
        );
    }

    public AnalyticsDataDTO getAnalyticsForDateRange(String doctorEmail, String startDate, String endDate) {
        // Implementation for date range analytics
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);

        // Get records in date range
        List<EcgRecord> records = ecgRecordRepository.findByDoctorAndDateAddedBetween(doctor, start, end);

        // Calculate distribution for this date range
        ClassificationDistributionDTO distribution = calculateDistributionForRecords(records);

        // Calculate trends for this period
        List<WeeklyTrendsDTO> trends = calculateTrendsForDateRange(doctor, start, end);

        ModelPerformanceDTO performance = getModelPerformance();

        return new AnalyticsDataDTO(distribution, trends, performance, records.size(), 2.3);
    }

    public byte[] generateAnalyticsReport(String doctorEmail) {
        // Mock implementation - in reality, you'd generate a PDF report
        AnalyticsDataDTO analytics = getDashboardAnalytics(doctorEmail);

        String reportContent = String.format(
                "Analytics Report for %s\n" +
                        "Generated on: %s\n\n" +
                        "Total Processed This Month: %d\n" +
                        "Classification Distribution:\n" +
                        "- Normal: %d\n" +
                        "- MI: %d\n" +
                        "- STTC: %d\n" +
                        "- CD: %d\n" +
                        "- HYP: %d\n",
                doctorEmail,
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                analytics.getTotalProcessedThisMonth(),
                analytics.getClassificationDistribution().getNorm(),
                analytics.getClassificationDistribution().getMi(),
                analytics.getClassificationDistribution().getSttc(),
                analytics.getClassificationDistribution().getCd(),
                analytics.getClassificationDistribution().getHyp()
        );

        return reportContent.getBytes();
    }

    public byte[] generatePatientDataExport(String doctorEmail) {
        // Mock implementation - in reality, you'd generate an Excel file
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        List<User> patients = userRepository.findByDoctor(doctor);

        StringBuilder csv = new StringBuilder();
        csv.append("Patient ID,Name,Email,Registration Date\n");

        for (User patient : patients) {
            csv.append(String.format("%s,%s,%s,%s\n",
                    patient.getId(),
                    patient.getName(),
                    patient.getEmail(),
                    patient.getBirthdate() != null ? patient.getBirthdate().toString() : "N/A"
            ));
        }

        return csv.toString().getBytes();
    }

    private String determineClassification(EcgRecord record) {
        // Determine classification based on highest probability
        double maxProb = 0;
        String classification = "NORM";

        if (record.getNormProbability() > maxProb) {
            maxProb = record.getNormProbability();
            classification = "NORM";
        }
        if (record.getMiProbability() > maxProb) {
            maxProb = record.getMiProbability();
            classification = "MI";
        }
        if (record.getSttcProbability() > maxProb) {
            maxProb = record.getSttcProbability();
            classification = "STTC";
        }
        if (record.getCdProbability() > maxProb) {
            maxProb = record.getCdProbability();
            classification = "CD";
        }
        if (record.getHypProbability() > maxProb) {
            classification = "HYP";
        }

        return classification;
    }

    private ClassificationDistributionDTO calculateDistributionForRecords(List<EcgRecord> records) {
        long norm = 0, mi = 0, sttc = 0, cd = 0, hyp = 0;

        for (EcgRecord record : records) {
            String classification = determineClassification(record);
            switch (classification) {
                case "NORM": norm++; break;
                case "MI": mi++; break;
                case "STTC": sttc++; break;
                case "CD": cd++; break;
                case "HYP": hyp++; break;
            }
        }

        return new ClassificationDistributionDTO(norm, mi, sttc, cd, hyp);
    }

    private List<WeeklyTrendsDTO> calculateTrendsForDateRange(User doctor, LocalDateTime start, LocalDateTime end) {
        List<WeeklyTrendsDTO> trends = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        LocalDate currentDate = start.toLocalDate();
        LocalDate endDate = end.toLocalDate();

        while (!currentDate.isAfter(endDate)) {
            LocalDateTime dayStart = currentDate.atStartOfDay();
            LocalDateTime dayEnd = currentDate.atTime(23, 59, 59);

            long uploads = ecgRecordRepository.countByDoctorAndDateAddedBetween(doctor, dayStart, dayEnd);
            trends.add(new WeeklyTrendsDTO(currentDate.format(formatter), uploads));

            currentDate = currentDate.plusDays(1);
        }

        return trends;
    }
}