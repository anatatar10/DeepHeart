package org.example.backend.repository;

import org.example.backend.model.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PredictionRepository extends JpaRepository<Prediction, UUID> {
    List<Prediction> findByEcgRecordId(UUID ecgRecordId);
}