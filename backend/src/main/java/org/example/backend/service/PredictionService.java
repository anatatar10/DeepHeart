package org.example.backend.service;

import org.example.backend.model.Prediction;
import org.example.backend.repository.PredictionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PredictionService {

    @Autowired
    private PredictionRepository predictionRepository;

    public List<Prediction> getAllByEcgRecordId(UUID ecgRecordId) {
        return predictionRepository.findByEcgRecordId(ecgRecordId);
    }

    public Prediction save(Prediction prediction) {
        return predictionRepository.save(prediction);
    }

    public void delete(UUID id) {
        predictionRepository.deleteById(id);
    }

    public Prediction getById(UUID id) {
        return predictionRepository.findById(id).orElse(null);
    }
}