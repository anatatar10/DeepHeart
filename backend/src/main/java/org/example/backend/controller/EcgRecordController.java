// File: src/main/java/org/example/backend/controller/EcgRecordController.java

package org.example.backend.controller;
import java.util.stream.StreamSupport;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.model.EcgRecord;
import org.example.backend.model.User;
import org.example.backend.service.AiPredictionService;
import org.example.backend.service.EcgRecordService;
import org.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;



@RestController
@RequestMapping("/api/ecg")
@CrossOrigin(origins = "*")
public class EcgRecordController {

    private final EcgRecordService ecgRecordService;
    private final UserService userService;
    private final AiPredictionService aiPredictionService;
    private final ObjectMapper objectMapper;

    private static final String[] LABELS = {"NORM", "MI", "STTC", "CD", "HYP"};

    private static final Map<String, String> DESCRIPTIONS = Map.of(
            "NORM", "Normal sinus rhythm detected.",
            "MI", "Myocardial infarction detected.",
            "STTC", "ST/T wave changes observed.",
            "CD", "Conduction disturbances detected.",
            "HYP", "Hypertrophy patterns identified."
    );

    @Autowired
    public EcgRecordController(EcgRecordService ecgRecordService, UserService userService, AiPredictionService aiPredictionService) {
        this.ecgRecordService = ecgRecordService;
        this.userService = userService;
        this.aiPredictionService = aiPredictionService;
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping("/upload/single")
    public ResponseEntity<Map<String, Object>> uploadSingleEcg(
            @RequestParam("file") MultipartFile file,
            @RequestParam("patientId") UUID patientId,
            @RequestParam(value = "notes", required = false) String notes) {

        try {
            Map<String, Object> result = processSingleFile(file, patientId, notes);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "ERROR",
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadMultipleEcg(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("patientId") UUID patientId,
            @RequestParam(value = "notes", required = false) String notes) {

        List<Map<String, Object>> results = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                results.add(processSingleFile(file, patientId, notes));
            } catch (Exception e) {
                results.add(Map.of(
                        "fileName", file.getOriginalFilename(),
                        "status", "ERROR",
                        "error", e.getMessage()
                ));
            }
        }

        return ResponseEntity.ok(Map.of(
                "results", results,
                "totalFiles", files.length
        ));
    }

    @GetMapping("/patient/{patientId}/records")
    public ResponseEntity<List<Map<String, Object>>> getPatientRecords(@PathVariable UUID patientId) {
        List<EcgRecord> allRecords = ecgRecordService.getEcgRecordsForPatient(patientId);
        List<Map<String, Object>> savedRecords = allRecords.stream()
                .filter(record -> "Saved to Patient Record".equals(record.getStatus()))
                .map(this::convertToFrontendFormat)
                .collect(Collectors.toList());
        return ResponseEntity.ok(savedRecords);
    }

    @PostMapping("/{ecgId}/save-to-record")
    public ResponseEntity<Map<String, Object>> saveToPatientRecord(@PathVariable UUID ecgId) {
        EcgRecord record = ecgRecordService.getById(ecgId);
        if (record == null) return ResponseEntity.notFound().build();

        record.setStatus("Saved to Patient Record");
        ecgRecordService.save(record);
        return ResponseEntity.ok(Map.of("message", "ECG saved to patient record."));
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path file = Paths.get("uploads").resolve(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private Map<String, Object> processSingleFile(MultipartFile file, UUID patientId, String notes) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !isValidFile(originalFilename)) {
            throw new IllegalArgumentException("Unsupported file format.");
        }

        String uploadDir = System.getProperty("user.dir") + "/uploads/";
        Files.createDirectories(Paths.get(uploadDir));
        String filename = UUID.randomUUID() + "_" + originalFilename;
        Path path = Paths.get(uploadDir + filename);
        Files.copy(file.getInputStream(), path);

        User patient = userService.getUserById(patientId).orElseThrow(() -> new IllegalArgumentException("Invalid patient ID"));
        User doctor = patient.getDoctor();

        String predictionJson = aiPredictionService.predictEcgImage(path.toFile());
        JsonNode predictionNode = objectMapper.readTree(predictionJson);

        System.out.println("=== JAVA CONTROLLER DEBUG ===");
        System.out.println("Raw AI prediction JSON: " + predictionJson);
        System.out.println("Parsed prediction node keys: " +
                StreamSupport.stream(
                                Spliterators.spliteratorUnknownSize(predictionNode.fieldNames(), Spliterator.ORDERED), false)
                        .collect(Collectors.toList())
        );

        Map<String, Object> allPredictions = new LinkedHashMap<>();

        if (predictionNode.has("model1")) {
            JsonNode model1 = predictionNode.get("model1");
            allPredictions.put("model1", Map.of(
                    "classification", model1.get("classification").asText(),
                    "confidence", model1.get("confidence").asDouble(),
                    "probabilities", extractProbabilities(model1.get("probabilities"))
            ));
        }

        if (predictionNode.has("model2")) {
            JsonNode model2 = predictionNode.get("model2");
            allPredictions.put("model2", Map.of(
                    "classification", model2.get("classification").asText(),
                    "confidence", model2.get("confidence").asDouble(),
                    "probabilities", extractProbabilities(model2.get("probabilities"))
            ));
        }

        String classification = predictionNode.get("classification").asText();
        double confidence = predictionNode.get("confidence").asDouble();
        JsonNode probs = predictionNode.get("probabilities");

        EcgRecord ecgRecord = new EcgRecord(patient, doctor, filename, "Processed");
        ecgRecord.setNormProbability(probs.get("NORM").asDouble());
        ecgRecord.setMiProbability(probs.get("MI").asDouble());
        ecgRecord.setSttcProbability(probs.get("STTC").asDouble());
        ecgRecord.setCdProbability(probs.get("CD").asDouble());
        ecgRecord.setHypProbability(probs.get("HYP").asDouble());
        ecgRecord = ecgRecordService.save(ecgRecord);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", ecgRecord.getId().toString());
        response.put("fileName", filename);
        response.put("classification", classification);
        response.put("confidence", confidence);
        response.put("probabilities", extractProbabilities(probs));
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("patientId", patientId.toString());
        response.put("notes", notes);
        response.put("status", "SUCCESS");
        response.put("description", DESCRIPTIONS.getOrDefault(classification, "Classification completed"));
        response.put("allPredictions", allPredictions);

        System.out.println("=== END JAVA CONTROLLER DEBUG ===");
        return response;
    }

    private Map<String, Double> extractProbabilities(JsonNode probsNode) {
        return Map.of(
                "NORM", probsNode.get("NORM").asDouble(),
                "MI", probsNode.get("MI").asDouble(),
                "STTC", probsNode.get("STTC").asDouble(),
                "CD", probsNode.get("CD").asDouble(),
                "HYP", probsNode.get("HYP").asDouble()
        );
    }

    private boolean isValidFile(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".dcm");
    }

    private Map<String, Object> convertToFrontendFormat(EcgRecord record) {
        Map<String, Double> probabilities = Map.of(
                "NORM", record.getNormProbability(),
                "MI", record.getMiProbability(),
                "STTC", record.getSttcProbability(),
                "CD", record.getCdProbability(),
                "HYP", record.getHypProbability()
        );

        String classification = probabilities.entrySet().stream()
                .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("UNKNOWN");

        double confidence = probabilities.getOrDefault(classification, 0.0);

        return Map.of(
                "id", record.getId().toString(),
                "fileName", record.getFilename(),
                "timestamp", record.getDateAdded().toString(),
                "patientId", record.getUser().getId().toString(),
                "classification", classification,
                "confidence", confidence,
                "probabilities", probabilities,
                "description", DESCRIPTIONS.getOrDefault(classification, ""),
                "status", record.getStatus()
        );
    }
}