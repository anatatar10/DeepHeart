// File: src/main/java/org/example/backend/controller/EcgRecordController.java
package org.example.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.model.EcgRecord;
import org.example.backend.model.User;
import org.example.backend.service.AiPredictionService;
import org.example.backend.service.EcgRecordService;
import org.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/api/ecg")
@CrossOrigin(origins = "*")
public class EcgRecordController {

    private final EcgRecordService ecgRecordService;
    private final UserService userService;
    private final AiPredictionService aiPredictionService;

    @Autowired
    public EcgRecordController(EcgRecordService ecgRecordService,
                               UserService userService,
                               AiPredictionService aiPredictionService) {
        this.ecgRecordService = ecgRecordService;
        this.userService = userService;
        this.aiPredictionService = aiPredictionService;
    }

    @GetMapping("/user/{userId}")
    public List<EcgRecord> getAllByUser(@PathVariable UUID userId) {
        return ecgRecordService.getAllByUserId(userId);
    }

    @GetMapping("/{id}")
    public EcgRecord getById(@PathVariable UUID id) {
        return ecgRecordService.getById(id);
    }

    @PostMapping
    public EcgRecord addEcg(@RequestBody EcgRecord ecgRecord) {
        return ecgRecordService.save(ecgRecord);
    }

    @DeleteMapping("/{id}")
    public void deleteEcg(@PathVariable UUID id) {
        ecgRecordService.delete(id);
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadEcg(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") UUID userId) {

        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || (!originalFilename.endsWith(".png") &&
                    !originalFilename.endsWith(".jpg") &&
                    !originalFilename.endsWith(".jpeg"))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Unsupported file format."));
            }

            // Create upload folder if not exists
            String uploadDir = System.getProperty("user.dir") + "/uploads/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            // Save file
            String filename = UUID.randomUUID() + "_" + originalFilename;
            Path path = Paths.get(uploadDir + filename);
            Files.copy(file.getInputStream(), path);

            // Find user
            Optional<User> userOpt = userService.getUserById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid user ID."));
            }

            // Predict using AI model
            String predictionJson = aiPredictionService.predictEcgImage(path.toFile());

            // Parse JSON string into Map
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Double> probs = mapper.readValue(predictionJson, new TypeReference<>() {});

            // Save ECG record with prediction probabilities
            EcgRecord ecgRecord = new EcgRecord(userOpt.get(), filename, "Processed");
            ecgRecord.setNormProbability(probs.getOrDefault("NORM", 0.0));
            ecgRecord.setMiProbability(probs.getOrDefault("MI", 0.0));
            ecgRecord.setSttcProbability(probs.getOrDefault("STTC", 0.0));
            ecgRecord.setCdProbability(probs.getOrDefault("CD", 0.0));
            ecgRecord.setHypProbability(probs.getOrDefault("HYP", 0.0));
            ecgRecordService.save(ecgRecord);

            // Return predictions in JSON
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("recordId", ecgRecord.getId());
            response.put("filename", filename);
            response.put("predictions", probs);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
}
