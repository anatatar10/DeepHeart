package org.example.backend.repository;

import org.example.backend.model.EcgRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EcgRecordRepository extends JpaRepository<EcgRecord, UUID> {
    List<EcgRecord> findByUserId(UUID userId);
}
