package org.example.backend.controller;

import org.example.backend.controller.AnalyticsController;
import org.example.backend.dto.AnalyticsDataDTO;
import org.example.backend.dto.ClassificationDistributionDTO;
import org.example.backend.dto.ModelPerformanceDTO;
import org.example.backend.dto.WeeklyTrendsDTO;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.example.backend.service.AnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

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
        Mockito.when(userRepository.findByEmail(ArgumentMatchers.any())).thenReturn(java.util.Optional.of(doctor));
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    public void testGetDashboardAnalytics() throws Exception {
        AnalyticsDataDTO mockData = getMockAnalyticsData();
        Mockito.when(analyticsService.getDashboardAnalytics(ArgumentMatchers.any(User.class))).thenReturn(mockData);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/analytics/dashboard")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    public void testGetClassificationDistribution() throws Exception {
        ClassificationDistributionDTO mockDistribution = new ClassificationDistributionDTO(10, 5, 3, 2, 1);
        Mockito.when(analyticsService.getClassificationDistribution(ArgumentMatchers.any(User.class))).thenReturn(mockDistribution);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/analytics/distribution")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    public void testGetWeeklyTrends() throws Exception {
        List<WeeklyTrendsDTO> mockTrends = Collections.singletonList(new WeeklyTrendsDTO("2025-06-11", 5));
        Mockito.when(analyticsService.getWeeklyTrends(ArgumentMatchers.any(User.class))).thenReturn(mockTrends);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/analytics/trends")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    public void testGetModelPerformance() throws Exception {
        ModelPerformanceDTO mockPerformance = new ModelPerformanceDTO(95.5, 90.0, 92.0, 94.0, LocalDateTime.now());
        Mockito.when(analyticsService.calculateModelPerformance(ArgumentMatchers.any(User.class))).thenReturn(mockPerformance);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/analytics/performance")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk());
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