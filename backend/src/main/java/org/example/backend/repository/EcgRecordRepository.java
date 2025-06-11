package org.example.backend.repository;

import org.example.backend.model.EcgRecord;
import org.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface EcgRecordRepository extends JpaRepository<EcgRecord, UUID> {

    long countByDoctor(User doctor);

    // Use the exact field name from your EcgRecord entity:
    long countByDoctorAndDateAddedBetween(User doctor, LocalDateTime start, LocalDateTime end);

    List<EcgRecord> findByUserId(UUID userId);

    long countByDoctorAndDateAddedAfter(User doctor, LocalDateTime start);

    List<EcgRecord> findByDoctor(User doctor);

    List<EcgRecord> findByDoctorAndDateAddedBetween(User doctor, LocalDateTime start, LocalDateTime end);

    List<EcgRecord> findByDoctorAndDateAddedAfter(User doctor, LocalDateTime start);
}