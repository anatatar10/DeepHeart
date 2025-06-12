package org.example.backend.service;

import org.example.backend.model.Prediction;
import org.example.backend.repository.PredictionRepository;
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
        predictionRepository = mock(PredictionRepository.class);
        predictionService = new PredictionService();
        ReflectionTestUtils.setField(predictionService, "predictionRepository", predictionRepository);
    }

    @Test
    public void testSavePrediction() {
        Prediction prediction = new Prediction();
        ReflectionTestUtils.setField(prediction, "id", UUID.randomUUID());

        when(predictionRepository.save(prediction)).thenReturn(prediction);

        Prediction saved = predictionService.save(prediction);

        assertThat(saved).isEqualTo(prediction);
    }

    @Test
    public void testGetAllByEcgRecordId() {
        UUID ecgRecordId = UUID.randomUUID();
        List<Prediction> predictions = new ArrayList<>();
        predictions.add(new Prediction());

        when(predictionRepository.findByEcgRecordId(ecgRecordId)).thenReturn(predictions);

        List<Prediction> result = predictionService.getAllByEcgRecordId(ecgRecordId);

        assertThat(result).hasSize(1);
    }

    @Test
    public void testGetById() {
        UUID id = UUID.randomUUID();
        Prediction prediction = new Prediction();
        ReflectionTestUtils.setField(prediction, "id", id);

        when(predictionRepository.findById(id)).thenReturn(Optional.of(prediction));

        Prediction result = predictionService.getById(id);

        assertThat(result).isEqualTo(prediction);
    }

    @Test
    public void testDelete() {
        UUID id = UUID.randomUUID();

        predictionService.delete(id);

        verify(predictionRepository, times(1)).deleteById(id);
    }
}