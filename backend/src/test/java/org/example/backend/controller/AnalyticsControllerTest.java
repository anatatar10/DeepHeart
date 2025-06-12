package org.example.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.AnalyticsDataDTO;
import org.example.backend.dto.ClassificationDistributionDTO;
import org.example.backend.dto.ModelPerformanceDTO;
import org.example.backend.dto.WeeklyTrendsDTO;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.example.backend.service.AnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

@WebMvcTest(controllers = AnalyticsController.class)
public class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalyticsService analyticsService;

    @MockBean
    private UserRepository userRepository;

    private User doctor;

    @BeforeEach
    public void setup() {
        doctor = new User();
        doctor.setName("Dr. Test");
        doctor.setEmail("doctor@test.com");
        when(userRepository.findByEmail(any())).thenReturn(java.util.Optional.of(doctor));
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    public void testGetDashboardAnalytics() throws Exception {
        AnalyticsDataDTO mockData = getMockAnalyticsData();
        when(analyticsService.getDashboardAnalytics(any(User.class))).thenReturn(mockData);

        mockMvc.perform(get("/api/analytics/dashboard")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    public void testGetClassificationDistribution() throws Exception {
        ClassificationDistributionDTO mockDistribution = new ClassificationDistributionDTO(10, 5, 3, 2, 1);
        when(analyticsService.getClassificationDistribution(any(User.class))).thenReturn(mockDistribution);

        mockMvc.perform(get("/api/analytics/distribution")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    public void testGetWeeklyTrends() throws Exception {
        List<WeeklyTrendsDTO> mockTrends = Collections.singletonList(new WeeklyTrendsDTO("2025-06-11", 5));
        when(analyticsService.getWeeklyTrends(any(User.class))).thenReturn(mockTrends);

        mockMvc.perform(get("/api/analytics/trends")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    public void testGetModelPerformance() throws Exception {
        ModelPerformanceDTO mockPerformance = new ModelPerformanceDTO(95.5, 90.0, 92.0, 94.0, LocalDateTime.now());
        when(analyticsService.calculateModelPerformance(any(User.class))).thenReturn(mockPerformance);

        mockMvc.perform(get("/api/analytics/performance")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // Mock data builder
    private AnalyticsDataDTO getMockAnalyticsData() {
        return new AnalyticsDataDTO(
                new ClassificationDistributionDTO(10, 5, 3, 2, 1),
                List.of(new WeeklyTrendsDTO("2025-06-11", 5)),
                new ModelPerformanceDTO(95.5, 90.0, 92.0, 94.0, LocalDateTime.now()),
                100,
                2.5
        );
    }
}