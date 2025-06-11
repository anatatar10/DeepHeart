package org.example.backend.service;

import org.example.backend.dto.DashboardStatsDTO;
import org.example.backend.model.User;
import org.example.backend.repository.EcgRecordRepository;
import org.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Service
public class DashboardService {

    private final EcgRecordRepository ecgRecordRepository;
    private final UserRepository userRepository;

    public DashboardService(EcgRecordRepository ecgRecordRepository, UserRepository userRepository) {
        this.ecgRecordRepository = ecgRecordRepository;
        this.userRepository = userRepository;
    }

    public DashboardStatsDTO getDashboardStatsForDoctorById(UUID doctorId) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        long totalUploads = ecgRecordRepository.countByDoctor(doctor);

        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.now().with(LocalTime.MAX);
        long todaysUploads = ecgRecordRepository.countByDoctorAndDateAddedBetween(doctor, startOfDay, endOfDay);
        long totalPatients = userRepository.countByDoctor(doctor);

        return new DashboardStatsDTO(totalUploads, totalPatients, todaysUploads);
    }

    public DashboardStatsDTO getDashboardStatsForDoctorByEmail(String email) {
        User doctor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        long totalUploads = ecgRecordRepository.countByDoctor(doctor);

        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.now().with(LocalTime.MAX);
        long todaysUploads = ecgRecordRepository.countByDoctorAndDateAddedBetween(doctor, startOfDay, endOfDay);

        long totalPatients = userRepository.countByDoctor(doctor);

        return new DashboardStatsDTO(totalUploads, totalPatients, todaysUploads);
    }
}