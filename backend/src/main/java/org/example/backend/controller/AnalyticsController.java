package org.example.backend.controller;

import org.example.backend.dto.*;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
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
    private final UserRepository userRepository;

    public AnalyticsController(AnalyticsService analyticsService, UserRepository userRepository) {
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
    }

    private User getCurrentDoctor(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<AnalyticsDataDTO> getDashboardAnalytics(Authentication authentication) {
        User doctor = getCurrentDoctor(authentication);
        AnalyticsDataDTO analytics = analyticsService.getDashboardAnalytics(doctor);
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/distribution")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<ClassificationDistributionDTO> getClassificationDistribution(Authentication authentication) {
        User doctor = getCurrentDoctor(authentication);
        ClassificationDistributionDTO distribution = analyticsService.getClassificationDistribution(doctor);
        return ResponseEntity.ok(distribution);
    }

    @GetMapping("/trends")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<List<WeeklyTrendsDTO>> getWeeklyTrends(Authentication authentication) {
        User doctor = getCurrentDoctor(authentication);
        List<WeeklyTrendsDTO> trends = analyticsService.getWeeklyTrends(doctor);
        return ResponseEntity.ok(trends);
    }

    @GetMapping("/performance")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<ModelPerformanceDTO> getModelPerformance(Authentication authentication) {
        User doctor = getCurrentDoctor(authentication);
        ModelPerformanceDTO performance = analyticsService.calculateModelPerformance(doctor);
        return ResponseEntity.ok(performance);
    }

    @GetMapping("/export/report")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportAnalyticsReport(Authentication authentication) {
        User doctor = getCurrentDoctor(authentication);
        byte[] reportData = analyticsService.generateAnalyticsReport(doctor);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "analytics-report.pdf");
        return ResponseEntity.ok().headers(headers).body(reportData);
    }

    @GetMapping("/export/patients")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportPatientData(Authentication authentication) {
        User doctor = getCurrentDoctor(authentication);
        byte[] excelData = analyticsService.generatePatientDataExport(doctor);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "patient-data.xlsx");
        return ResponseEntity.ok().headers(headers).body(excelData);
    }

    @GetMapping("/range")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<AnalyticsDataDTO> getAnalyticsForDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication authentication) {

        User doctor = getCurrentDoctor(authentication);
        AnalyticsDataDTO analytics = analyticsService.getAnalyticsForDateRange(doctor, startDate, endDate);
        return ResponseEntity.ok(analytics);
    }
}