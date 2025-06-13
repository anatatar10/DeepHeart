package org.example.backend.service;

import org.assertj.core.api.Assertions;
import org.example.backend.model.Prediction;
import org.example.backend.repository.PredictionRepository;
import org.example.backend.service.PredictionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

public class PredictionServiceTest {

    private PredictionRepository predictionRepository;
    private PredictionService predictionService;

    @BeforeEach
    public void setup() {
        predictionRepository = Mockito.mock(PredictionRepository.class);
        predictionService = new PredictionService();
        ReflectionTestUtils.setField(predictionService, "predictionRepository", predictionRepository);
    }

    @Test
    public void testSavePrediction() {
        Prediction prediction = new Prediction();
        ReflectionTestUtils.setField(prediction, "id", UUID.randomUUID());

        Mockito.when(predictionRepository.save(prediction)).thenReturn(prediction);

        Prediction saved = predictionService.save(prediction);

        Assertions.assertThat(saved).isEqualTo(prediction);
    }

    @Test
    public void testGetAllByEcgRecordId() {
        UUID ecgRecordId = UUID.randomUUID();
        List<Prediction> predictions = new ArrayList<>();
        predictions.add(new Prediction());

        Mockito.when(predictionRepository.findByEcgRecordId(ecgRecordId)).thenReturn(predictions);

        List<Prediction> result = predictionService.getAllByEcgRecordId(ecgRecordId);

        Assertions.assertThat(result).hasSize(1);
    }

    @Test
    public void testGetById() {
        UUID id = UUID.randomUUID();
        Prediction prediction = new Prediction();
        ReflectionTestUtils.setField(prediction, "id", id);

        Mockito.when(predictionRepository.findById(id)).thenReturn(Optional.of(prediction));

        Prediction result = predictionService.getById(id);

        Assertions.assertThat(result).isEqualTo(prediction);
    }

    @Test
    public void testDelete() {
        UUID id = UUID.randomUUID();

        predictionService.delete(id);

        Mockito.verify(predictionRepository, Mockito.times(1)).deleteById(id);
    }
}