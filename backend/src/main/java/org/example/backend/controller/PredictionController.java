package org.example.backend.controller;

import org.example.backend.model.Prediction;
import org.example.backend.service.PredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/predictions")
@CrossOrigin(origins = "*")
public class PredictionController {

    @Autowired
    private PredictionService predictionService;

    @GetMapping("/ecg/{ecgId}")
    public List<Prediction> getAllByEcg(@PathVariable UUID ecgId) {
        return predictionService.getAllByEcgRecordId(ecgId);
    }

    @PostMapping
    public Prediction addPrediction(@RequestBody Prediction prediction) {
        return predictionService.save(prediction);
    }

    @GetMapping("/{id}")
    public Prediction getById(@PathVariable UUID id) {
        return predictionService.getById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        predictionService.delete(id);
    }
}
