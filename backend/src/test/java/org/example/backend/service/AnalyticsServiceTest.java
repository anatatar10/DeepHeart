// File: src/test/java/org/example/backend/service/AnalyticsServiceTest.java

package org.example.backend.service;

import org.example.backend.dto.*;
import org.example.backend.model.EcgRecord;
import org.example.backend.model.User;
import org.example.backend.repository.EcgRecordRepository;
import org.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AnalyticsServiceTest {

    private AnalyticsService analyticsService;
    private EcgRecordRepository ecgRecordRepository;
    private UserRepository userRepository;

    private User mockDoctor;

    @BeforeEach
    public void setUp() {
        ecgRecordRepository = mock(EcgRecordRepository.class);
        userRepository = mock(UserRepository.class);
        analyticsService = new AnalyticsService(ecgRecordRepository, userRepository);

        mockDoctor = new User();
        mockDoctor.setName("Dr. Test");
        mockDoctor.setEmail("doctor@test.com");
        // we don't need UUID here to avoid ReflectionTestUtils
    }

    @Test
    public void testGetDashboardAnalytics_WithRecords() {
        List<EcgRecord> records = generateMockRecords(10);
        when(ecgRecordRepository.findByDoctor(mockDoctor)).thenReturn(records);
        when(ecgRecordRepository.countByDoctorAndDateAddedAfter(eq(mockDoctor), any())).thenReturn(10L);
        when(ecgRecordRepository.findByDoctorAndDateAddedAfter(eq(mockDoctor), any())).thenReturn(records);

        AnalyticsDataDTO analytics = analyticsService.getDashboardAnalytics(mockDoctor);
        assertNotNull(analytics);
        assertTrue(analytics.getTotalProcessedThisMonth() >= 0);
        assertTrue(analytics.getAverageProcessingTime() >= 0);
    }

    @Test
    public void testGetDashboardAnalytics_NoRecords() {
        when(ecgRecordRepository.findByDoctor(mockDoctor)).thenReturn(Collections.emptyList());
        when(ecgRecordRepository.countByDoctorAndDateAddedAfter(eq(mockDoctor), any())).thenReturn(0L);
        when(ecgRecordRepository.findByDoctorAndDateAddedAfter(eq(mockDoctor), any())).thenReturn(Collections.emptyList());

        AnalyticsDataDTO analytics = analyticsService.getDashboardAnalytics(mockDoctor);
        assertNotNull(analytics);
        assertEquals(0, analytics.getTotalProcessedThisMonth());
        assertEquals(0.0, analytics.getAverageProcessingTime());
        assertEquals(0.0, analytics.getModelPerformance().getAccuracy());
    }

    @Test
    public void testClassificationDistribution() {
        List<EcgRecord> records = generateMockRecords(5);
        when(ecgRecordRepository.findByDoctor(mockDoctor)).thenReturn(records);

        ClassificationDistributionDTO distribution = analyticsService.getClassificationDistribution(mockDoctor);
        assertNotNull(distribution);
        long total = distribution.getNorm() + distribution.getMi() + distribution.getSttc() + distribution.getCd() + distribution.getHyp();
        assertEquals(5, total);
    }

    @Test
    public void testModelPerformance() {
        List<EcgRecord> records = generateMockRecords(5);
        when(ecgRecordRepository.findByDoctor(mockDoctor)).thenReturn(records);

        ModelPerformanceDTO performance = analyticsService.calculateModelPerformance(mockDoctor);
        assertNotNull(performance);
        assertTrue(performance.getAccuracy() >= 0);
        assertTrue(performance.getAuc() >= 0);
    }

    @Test
    public void testGenerateReport() {
        when(ecgRecordRepository.findByDoctor(mockDoctor)).thenReturn(Collections.emptyList());
        when(ecgRecordRepository.countByDoctorAndDateAddedAfter(eq(mockDoctor), any())).thenReturn(0L);
        when(ecgRecordRepository.findByDoctorAndDateAddedAfter(eq(mockDoctor), any())).thenReturn(Collections.emptyList());

        byte[] report = analyticsService.generateAnalyticsReport(mockDoctor);
        assertNotNull(report);
        assertTrue(report.length > 0);
    }

    private List<EcgRecord> generateMockRecords(int count) {
        List<EcgRecord> records = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            EcgRecord record = new EcgRecord();
            record.setNormProbability(0.6);
            record.setMiProbability(0.2);
            record.setSttcProbability(0.1);
            record.setCdProbability(0.05);
            record.setHypProbability(0.05);
            record.setDateAdded(LocalDateTime.now());
            records.add(record);
        }
        return records;
    }
}