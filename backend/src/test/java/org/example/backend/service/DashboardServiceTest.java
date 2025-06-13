package org.example.backend.service;

import org.assertj.core.api.Assertions;
import org.example.backend.dto.DashboardStatsDTO;
import org.example.backend.model.Role;
import org.example.backend.model.User;
import org.example.backend.repository.EcgRecordRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

public class DashboardServiceTest {

    private EcgRecordRepository ecgRecordRepository;
    private UserRepository userRepository;
    private DashboardService dashboardService;

    @BeforeEach
    public void setUp() {
        ecgRecordRepository = Mockito.mock(EcgRecordRepository.class);
        userRepository = Mockito.mock(UserRepository.class);
        dashboardService = new DashboardService(ecgRecordRepository, userRepository);
    }

    @Test
    public void testGetDashboardStatsForDoctorById() {
        UUID doctorId = UUID.randomUUID();

        User doctor = new User();
        doctor.setRole(Role.DOCTOR);
        doctor.setEmail("doctor@test.com");
        ReflectionTestUtils.setField(doctor, "id", doctorId);  // 🔧 inject ID

        Mockito.when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctor));
        Mockito.when(ecgRecordRepository.countByDoctor(doctor)).thenReturn(20L);
        Mockito.when(ecgRecordRepository.countByDoctorAndDateAddedBetween(ArgumentMatchers.eq(doctor), ArgumentMatchers.any(), ArgumentMatchers.any())).thenReturn(5L);
        Mockito.when(userRepository.countByDoctor(doctor)).thenReturn(10L);

        DashboardStatsDTO stats = dashboardService.getDashboardStatsForDoctorById(doctorId);

        Assertions.assertThat(stats).isNotNull();
        Assertions.assertThat(stats.getTotalUploads()).isEqualTo(20);
        Assertions.assertThat(stats.getTodaysUploads()).isEqualTo(5);
        Assertions.assertThat(stats.getTotalPatients()).isEqualTo(10);
    }

    @Test
    public void testGetDashboardStatsForDoctorByEmail() {
        String doctorEmail = "doctor@test.com";
        UUID doctorId = UUID.randomUUID();

        User doctor = new User();
        doctor.setRole(Role.DOCTOR);
        doctor.setEmail(doctorEmail);
        ReflectionTestUtils.setField(doctor, "id", doctorId);  // 🔧 inject ID

        Mockito.when(userRepository.findByEmail(doctorEmail)).thenReturn(Optional.of(doctor));
        Mockito.when(ecgRecordRepository.countByDoctor(doctor)).thenReturn(15L);
        Mockito.when(ecgRecordRepository.countByDoctorAndDateAddedBetween(ArgumentMatchers.eq(doctor), ArgumentMatchers.any(), ArgumentMatchers.any())).thenReturn(3L);
        Mockito.when(userRepository.countByDoctor(doctor)).thenReturn(7L);

        DashboardStatsDTO stats = dashboardService.getDashboardStatsForDoctorByEmail(doctorEmail);

        Assertions.assertThat(stats).isNotNull();
        Assertions.assertThat(stats.getTotalUploads()).isEqualTo(15);
        Assertions.assertThat(stats.getTodaysUploads()).isEqualTo(3);
        Assertions.assertThat(stats.getTotalPatients()).isEqualTo(7);
    }
}