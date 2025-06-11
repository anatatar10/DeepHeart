package org.example.backend.controller;

import org.example.backend.dto.AnalyticsDataDTO;
import org.example.backend.dto.ClassificationDistributionDTO;
import org.example.backend.dto.ModelPerformanceDTO;
import org.example.backend.dto.WeeklyTrendsDTO;
import org.example.backend.service.AnalyticsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    // Get complete analytics dashboard data
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<AnalyticsDataDTO> getDashboardAnalytics(Authentication authentication) {
        String email = authentication.getName();
        AnalyticsDataDTO analytics = analyticsService.getDashboardAnalytics(email);
        return ResponseEntity.ok(analytics);
    }

    // Get classification distribution
    @GetMapping("/distribution")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<ClassificationDistributionDTO> getClassificationDistribution(Authentication authentication) {
        String email = authentication.getName();
        ClassificationDistributionDTO distribution = analyticsService.getClassificationDistribution(email);
        return ResponseEntity.ok(distribution);
    }

    // Get weekly trends
    @GetMapping("/trends")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<List<WeeklyTrendsDTO>> getWeeklyTrends(Authentication authentication) {
        String email = authentication.getName();
        List<WeeklyTrendsDTO> trends = analyticsService.getWeeklyTrends(email);
        return ResponseEntity.ok(trends);
    }

    // Get model performance metrics
    @GetMapping("/performance")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<ModelPerformanceDTO> getModelPerformance() {
        ModelPerformanceDTO performance = analyticsService.getModelPerformance();
        return ResponseEntity.ok(performance);
    }

    // Export analytics report as PDF
    @GetMapping("/export/report")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportAnalyticsReport(Authentication authentication) {
        String email = authentication.getName();
        byte[] reportData = analyticsService.generateAnalyticsReport(email);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "analytics-report.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(reportData);
    }

    // Export patient data as Excel
    @GetMapping("/export/patients")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportPatientData(Authentication authentication) {
        String email = authentication.getName();
        byte[] excelData = analyticsService.generatePatientDataExport(email);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "patient-data.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }

    // Get analytics for a specific date range
    @GetMapping("/range")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<AnalyticsDataDTO> getAnalyticsForDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication authentication) {
        String email = authentication.getName();
        AnalyticsDataDTO analytics = analyticsService.getAnalyticsForDateRange(email, startDate, endDate);
        return ResponseEntity.ok(analytics);
    }
}