package org.example.backend.controller;

import org.example.backend.dto.DashboardStatsDTO;
import org.example.backend.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<DashboardStatsDTO> getStatsByDoctorId(@PathVariable UUID doctorId) {
        DashboardStatsDTO stats = dashboardService.getDashboardStatsForDoctorById(doctorId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DashboardStatsDTO> getStatsForCurrentDoctor(Authentication authentication) {
        String email = authentication.getName();
        DashboardStatsDTO stats = dashboardService.getDashboardStatsForDoctorByEmail(email);
        return ResponseEntity.ok(stats);
    }
}