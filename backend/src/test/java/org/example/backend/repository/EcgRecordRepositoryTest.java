package org.example.backend.repository;

import org.example.backend.model.EcgRecord;
import org.example.backend.model.Role;
import org.example.backend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class EcgRecordRepositoryTest {

    @Autowired
    private EcgRecordRepository ecgRecordRepository;

    @Autowired
    private UserRepository userRepository;

    private User doctor;
    private User patient;

    @BeforeEach
    void setUp() {
        ecgRecordRepository.deleteAll();
        userRepository.deleteAll();

        // Create and save doctor user
        doctor = new User();
        doctor.setName("Dr. Test Doctor");
        doctor.setEmail("doctor@example.com");
        doctor.setUsername("doctortest");
        doctor.setPassword("password");
        doctor.setRole(Role.DOCTOR);
        userRepository.save(doctor);

        // Create and save patient user
        patient = new User();
        patient.setName("Patient Test");
        patient.setEmail("patient@example.com");
        patient.setUsername("patienttest");
        patient.setPassword("password");
        patient.setRole(Role.PATIENT);
        userRepository.save(patient);

        // Insert some sample ECG records for this doctor and patient
        for (int i = 0; i < 5; i++) {
            EcgRecord record = new EcgRecord();
            record.setDoctor(doctor);
            record.setUser(patient);
            record.setNormProbability(0.7);
            record.setMiProbability(0.1);
            record.setSttcProbability(0.1);
            record.setCdProbability(0.05);
            record.setHypProbability(0.05);
            record.setDateAdded(LocalDateTime.now().minusDays(i));
            record.setFilename("test-file-" + i + ".png");
            record.setStatus("COMPLETED");
            ecgRecordRepository.save(record);
        }
    }

    @Test
    void testFindByDoctor() {
        List<EcgRecord> records = ecgRecordRepository.findByDoctor(doctor);
        assertThat(records).hasSize(5);
    }

    @Test
    void testCountByDoctorAndDateAddedAfter() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(2);
        long count = ecgRecordRepository.countByDoctorAndDateAddedAfter(doctor, cutoffDate);
        assertThat(count).isBetween(1L, 5L);
    }

    @Test
    void testFindByDoctorAndDateAddedBetween() {
        LocalDateTime startDate = LocalDateTime.now().minusDays(4);
        LocalDateTime endDate = LocalDateTime.now();
        List<EcgRecord> records = ecgRecordRepository.findByDoctorAndDateAddedBetween(doctor, startDate, endDate);
        assertThat(records).hasSize(5);
    }
}