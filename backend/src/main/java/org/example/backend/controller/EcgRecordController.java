// File: src/main/java/org/example/backend/controller/EcgRecordController.java
package org.example.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.model.EcgRecord;
import org.example.backend.model.User;
import org.example.backend.service.AiPredictionService;
import org.example.backend.service.EcgRecordService;
import org.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    // Classification labels
    private static final String[] LABELS = {"NORM", "MI", "STTC", "CD", "HYP"};

    // Classification descriptions
    private static final Map<String, String> DESCRIPTIONS = Map.of(
            "NORM", "Normal sinus rhythm detected. No significant abnormalities identified.",
            "MI", "Myocardial infarction patterns detected. Immediate cardiology consultation recommended.",
            "STTC", "ST/T wave changes observed. May indicate ischemia or other cardiac conditions.",
            "CD", "Conduction disturbances detected. Abnormal electrical conduction patterns.",
            "HYP", "Hypertrophy patterns identified. Enlarged heart chambers detected."
    );

    @Autowired
    public EcgRecordController(EcgRecordService ecgRecordService,
                               UserService userService,
                               AiPredictionService aiPredictionService) {
        this.ecgRecordService = ecgRecordService;
        this.userService = userService;
        this.aiPredictionService = aiPredictionService;
        this.objectMapper = new ObjectMapper();
    }

    @GetMapping("/user/{userId}")
    public List<EcgRecord> getAllByUser(@PathVariable UUID userId) {
        return ecgRecordService.getAllByUserId(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable UUID id) {
        try {
            EcgRecord record = ecgRecordService.getById(id);
            if (record == null) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> response = createDetailedResponse(record);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve ECG record: " + e.getMessage()));
        }
    }

    @PostMapping
    public EcgRecord addEcg(@RequestBody EcgRecord ecgRecord) {
        return ecgRecordService.save(ecgRecord);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteEcg(@PathVariable UUID id) {
        try {
            ecgRecordService.delete(id);
            return ResponseEntity.ok(Map.of("message", "ECG record deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete ECG record: " + e.getMessage()));
        }
    }

    // Enhanced upload endpoint for multiple files (compatible with Angular frontend)
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadMultipleEcg(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("patientId") UUID patientId,
            @RequestParam(value = "notes", required = false) String notes) {

        List<Map<String, Object>> results = new ArrayList<>();
        int successfulFiles = 0;
        int failedFiles = 0;

        for (MultipartFile file : files) {
            try {
                Map<String, Object> result = processSingleFile(file, patientId, notes);
                results.add(result);

                if ("SUCCESS".equals(result.get("status"))) {
                    successfulFiles++;
                } else {
                    failedFiles++;
                }
            } catch (Exception e) {
                failedFiles++;
                Map<String, Object> errorResult = createErrorResponse(file.getOriginalFilename(), e.getMessage());
                results.add(errorResult);
            }
        }

        Map<String, Object> batchResponse = new LinkedHashMap<>();
        batchResponse.put("results", results);
        batchResponse.put("totalFiles", files.length);
        batchResponse.put("successfulFiles", successfulFiles);
        batchResponse.put("failedFiles", failedFiles);
        batchResponse.put("batchId", UUID.randomUUID().toString());

        return ResponseEntity.ok(batchResponse);
    }

    // Single file upload endpoint
    @PostMapping("/upload/single")
    public ResponseEntity<Map<String, Object>> uploadSingleEcg(
            @RequestParam("file") MultipartFile file,
            @RequestParam("patientId") UUID patientId,
            @RequestParam(value = "notes", required = false) String notes) {

        try {
            Map<String, Object> result = processSingleFile(file, patientId, notes);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResponse = createErrorResponse(file.getOriginalFilename(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // File validation endpoint
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateEcgFile(@RequestParam("file") MultipartFile file) {
        try {
            String originalFilename = file.getOriginalFilename();

            // Check file size (50MB limit)
            if (file.getSize() > 50 * 1024 * 1024) {
                return ResponseEntity.ok(Map.of(
                        "valid", false,
                        "message", "File size exceeds 50MB limit"
                ));
            }

            // Check file format
            if (originalFilename == null || (!originalFilename.toLowerCase().endsWith(".png") &&
                    !originalFilename.toLowerCase().endsWith(".jpg") &&
                    !originalFilename.toLowerCase().endsWith(".jpeg") &&
                    !originalFilename.toLowerCase().endsWith(".dcm"))) {
                return ResponseEntity.ok(Map.of(
                        "valid", false,
                        "message", "Unsupported file format. Supported: PNG, JPG, JPEG, DICOM"
                ));
            }

            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "message", "File is valid"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "message", "File validation failed: " + e.getMessage()
            ));
        }
    }

    // Get supported formats
    @GetMapping("/supported-formats")
    public ResponseEntity<List<String>> getSupportedFormats() {
        List<String> formats = Arrays.asList("PNG", "JPG", "JPEG", "DICOM");
        return ResponseEntity.ok(formats);
    }

    // Get model metrics
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getModelMetrics() {
        Map<String, Object> metrics = new LinkedHashMap<>();

        // Model 1 metrics (your current DenseNet model)
        Map<String, Object> model1 = new LinkedHashMap<>();
        model1.put("name", "DenseNet Model");
        model1.put("accuracy", 0.95);
        model1.put("precision", 0.94);
        model1.put("recall", 0.93);
        model1.put("f1_score", 0.93);
        metrics.put("model1", model1);

        // If you add a second model, you can add its metrics here
        // Map<String, Object> model2 = new LinkedHashMap<>();
        // model2.put("name", "Secondary Model");
        // model2.put("accuracy", 0.92);
        // model2.put("precision", 0.91);
        // model2.put("recall", 0.90);
        // model2.put("f1_score", 0.90);
        // metrics.put("model2", model2);

        return ResponseEntity.ok(metrics);
    }

    // Save to patient record
    @PostMapping("/{ecgId}/save-to-record")
    public ResponseEntity<Map<String, Object>> saveToPatientRecord(@PathVariable UUID ecgId) {
        try {
            EcgRecord record = ecgRecordService.getById(ecgId);
            if (record == null) {
                return ResponseEntity.notFound().build();
            }

            // Update record status to indicate it's saved to patient record
            record.setStatus("Saved to Patient Record");
            ecgRecordService.save(record);

            return ResponseEntity.ok(Map.of(
                    "message", "ECG result saved to patient record successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save to patient record: " + e.getMessage()));
        }
    }

    // Helper method to process a single file
    private Map<String, Object> processSingleFile(MultipartFile file, UUID patientId, String notes) throws IOException {
        String originalFilename = file.getOriginalFilename();

        // Validate file format
        if (originalFilename == null || (!originalFilename.toLowerCase().endsWith(".png") &&
                !originalFilename.toLowerCase().endsWith(".jpg") &&
                !originalFilename.toLowerCase().endsWith(".jpeg") &&
                !originalFilename.toLowerCase().endsWith(".dcm"))) {
            throw new IllegalArgumentException("Unsupported file format");
        }

        // Create upload folder if not exists
        String uploadDir = System.getProperty("user.dir") + "/uploads/";
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        // Save file
        String filename = UUID.randomUUID() + "_" + originalFilename;
        Path path = Paths.get(uploadDir + filename);
        Files.copy(file.getInputStream(), path);

        // Find user (patient)
        Optional<User> userOpt = userService.getUserById(patientId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid patient ID");
        }

        User patient = userOpt.get();
        User doctor = patient.getDoctor();

        // STEP 1: AI Prediction
        System.out.println("=== STEP 1: AI PREDICTION ===");
        String predictionJson = aiPredictionService.predictEcgImage(path.toFile());
        System.out.println("Raw prediction JSON from AI service: " + predictionJson);

        // STEP 2: Parse JSON
        System.out.println("=== STEP 2: JSON PARSING ===");
        JsonNode predictionNode = objectMapper.readTree(predictionJson);
        System.out.println("Parsed JSON node: " + predictionNode);

        // Extract the main classification results
        String classification = predictionNode.get("classification").asText();
        double confidence = predictionNode.get("confidence").asDouble();
        System.out.println("Extracted classification: " + classification);
        System.out.println("Extracted confidence: " + confidence);

        // STEP 3: Extract probabilities
        System.out.println("=== STEP 3: EXTRACT PROBABILITIES ===");
        JsonNode probabilitiesNode = predictionNode.get("probabilities");
        System.out.println("Probabilities node: " + probabilitiesNode);

        Map<String, Double> probabilities = new LinkedHashMap<>();
        probabilities.put("NORM", probabilitiesNode.get("NORM").asDouble());
        probabilities.put("MI", probabilitiesNode.get("MI").asDouble());
        probabilities.put("STTC", probabilitiesNode.get("STTC").asDouble());
        probabilities.put("CD", probabilitiesNode.get("CD").asDouble());
        probabilities.put("HYP", probabilitiesNode.get("HYP").asDouble());

        System.out.println("Extracted probabilities map: " + probabilities);

        // STEP 4: Verify individual values
        System.out.println("=== STEP 4: INDIVIDUAL PROBABILITY VALUES ===");
        System.out.println("NORM: " + probabilities.get("NORM") + " (type: " + probabilities.get("NORM").getClass().getSimpleName() + ")");
        System.out.println("MI: " + probabilities.get("MI") + " (type: " + probabilities.get("MI").getClass().getSimpleName() + ")");
        System.out.println("STTC: " + probabilities.get("STTC") + " (type: " + probabilities.get("STTC").getClass().getSimpleName() + ")");
        System.out.println("CD: " + probabilities.get("CD") + " (type: " + probabilities.get("CD").getClass().getSimpleName() + ")");
        System.out.println("HYP: " + probabilities.get("HYP") + " (type: " + probabilities.get("HYP").getClass().getSimpleName() + ")");

        // STEP 5: Create ECG record
        System.out.println("=== STEP 5: CREATE ECG RECORD ===");
        EcgRecord ecgRecord = new EcgRecord(patient, doctor, filename, "Processed");

        // Set probabilities one by one with logging
        System.out.println("Setting NORM probability: " + probabilities.get("NORM"));
        ecgRecord.setNormProbability(probabilities.get("NORM"));
        System.out.println("ECG record NORM after set: " + ecgRecord.getNormProbability());

        System.out.println("Setting MI probability: " + probabilities.get("MI"));
        ecgRecord.setMiProbability(probabilities.get("MI"));
        System.out.println("ECG record MI after set: " + ecgRecord.getMiProbability());

        System.out.println("Setting STTC probability: " + probabilities.get("STTC"));
        ecgRecord.setSttcProbability(probabilities.get("STTC"));
        System.out.println("ECG record STTC after set: " + ecgRecord.getSttcProbability());

        System.out.println("Setting CD probability: " + probabilities.get("CD"));
        ecgRecord.setCdProbability(probabilities.get("CD"));
        System.out.println("ECG record CD after set: " + ecgRecord.getCdProbability());

        System.out.println("Setting HYP probability: " + probabilities.get("HYP"));
        ecgRecord.setHypProbability(probabilities.get("HYP"));
        System.out.println("ECG record HYP after set: " + ecgRecord.getHypProbability());

        if (notes != null && !notes.trim().isEmpty()) {
            // ecgRecord.setNotes(notes);
        }

        // STEP 6: Save to database
        System.out.println("=== STEP 6: SAVE TO DATABASE ===");
        System.out.println("ECG record before save: " +
                "NORM=" + ecgRecord.getNormProbability() +
                ", MI=" + ecgRecord.getMiProbability() +
                ", STTC=" + ecgRecord.getSttcProbability() +
                ", CD=" + ecgRecord.getCdProbability() +
                ", HYP=" + ecgRecord.getHypProbability());

        ecgRecord = ecgRecordService.save(ecgRecord);

        System.out.println("ECG record after save: " +
                "NORM=" + ecgRecord.getNormProbability() +
                ", MI=" + ecgRecord.getMiProbability() +
                ", STTC=" + ecgRecord.getSttcProbability() +
                ", CD=" + ecgRecord.getCdProbability() +
                ", HYP=" + ecgRecord.getHypProbability());

        // STEP 7: Create response
        System.out.println("=== STEP 7: CREATE RESPONSE ===");

        // Create probabilities map for response (use saved values)
        Map<String, Double> responseProbabilities = new LinkedHashMap<>();
        responseProbabilities.put("NORM", ecgRecord.getNormProbability());
        responseProbabilities.put("MI", ecgRecord.getMiProbability());
        responseProbabilities.put("STTC", ecgRecord.getSttcProbability());
        responseProbabilities.put("CD", ecgRecord.getCdProbability());
        responseProbabilities.put("HYP", ecgRecord.getHypProbability());

        System.out.println("Response probabilities map: " + responseProbabilities);

        // Create response compatible with Angular frontend
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", ecgRecord.getId().toString());
        response.put("fileName", originalFilename);
        response.put("classification", classification);
        response.put("confidence", confidence);
        response.put("probabilities", responseProbabilities);
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("patientId", patientId.toString());
        response.put("notes", notes);
        response.put("modelUsed", "ensemble");

        // Include model info if available
        Map<String, Object> allPredictions = new LinkedHashMap<>();
        if (predictionNode.has("model1")) {
            JsonNode model1Node = predictionNode.get("model1");
            Map<String, Object> model1Data = new LinkedHashMap<>();
            model1Data.put("classification", model1Node.get("classification").asText());
            model1Data.put("confidence", model1Node.get("confidence").asDouble());

            JsonNode model1Probs = model1Node.get("probabilities");
            Map<String, Double> model1ProbMap = new LinkedHashMap<>();
            model1ProbMap.put("NORM", model1Probs.get("NORM").asDouble());
            model1ProbMap.put("MI", model1Probs.get("MI").asDouble());
            model1ProbMap.put("STTC", model1Probs.get("STTC").asDouble());
            model1ProbMap.put("CD", model1Probs.get("CD").asDouble());
            model1ProbMap.put("HYP", model1Probs.get("HYP").asDouble());
            model1Data.put("probabilities", model1ProbMap);
            allPredictions.put("model1", model1Data);
        }

        if (predictionNode.has("model2")) {
            JsonNode model2Node = predictionNode.get("model2");
            Map<String, Object> model2Data = new LinkedHashMap<>();
            model2Data.put("classification", model2Node.get("classification").asText());
            model2Data.put("confidence", model2Node.get("confidence").asDouble());

            JsonNode model2Probs = model2Node.get("probabilities");
            Map<String, Double> model2ProbMap = new LinkedHashMap<>();
            model2ProbMap.put("NORM", model2Probs.get("NORM").asDouble());
            model2ProbMap.put("MI", model2Probs.get("MI").asDouble());
            model2ProbMap.put("STTC", model2Probs.get("STTC").asDouble());
            model2ProbMap.put("CD", model2Probs.get("CD").asDouble());
            model2ProbMap.put("HYP", model2Probs.get("HYP").asDouble());
            model2Data.put("probabilities", model2ProbMap);
            allPredictions.put("model2", model2Data);
        }

        response.put("allPredictions", allPredictions);

        // Extract description from the prediction or use default
        String description = predictionNode.has("description") ?
                predictionNode.get("description").asText() :
                DESCRIPTIONS.getOrDefault(classification, "Classification completed");

        response.put("description", description);
        response.put("status", "SUCCESS");

        // Include additional ensemble information
        if (predictionNode.has("ensemble")) {
            JsonNode ensembleNode = predictionNode.get("ensemble");
            if (ensembleNode.has("confidence_level")) {
                response.put("confidence_level", ensembleNode.get("confidence_level").asText());
            }
            if (ensembleNode.has("clinical_recommendation")) {
                response.put("clinical_recommendation", ensembleNode.get("clinical_recommendation").asText());
            }
            if (ensembleNode.has("model_agreement")) {
                response.put("model_agreement", ensembleNode.get("model_agreement"));
            }
        }

        // STEP 8: Final response verification
        System.out.println("=== STEP 8: FINAL RESPONSE ===");
        System.out.println("Final response object: " + response);
        System.out.println("Final response probabilities: " + response.get("probabilities"));
        System.out.println("=== END DEBUG ===");

        return response;
    }

    // Helper method to create error response
    private Map<String, Object> createErrorResponse(String fileName, String errorMessage) {
        Map<String, Object> errorResponse = new LinkedHashMap<>();
        errorResponse.put("id", UUID.randomUUID().toString());
        errorResponse.put("fileName", fileName);
        errorResponse.put("classification", "ERROR");
        errorResponse.put("confidence", 0.0);

        Map<String, Double> emptyProbs = new LinkedHashMap<>();
        for (String label : LABELS) {
            emptyProbs.put(label, 0.0);
        }
        errorResponse.put("probabilities", emptyProbs);
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", "ERROR");
        errorResponse.put("error", errorMessage);

        return errorResponse;
    }

    // Helper method to create detailed response
    private Map<String, Object> createDetailedResponse(EcgRecord record) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", record.getId().toString());
        response.put("fileName", record.getFilename());
        response.put("originalFileName", record.getFilename());
        response.put("uploadTimestamp", record.getDateAdded().toString());
        response.put("patientId", record.getId().toString());
        response.put("patientName", record.getUser().getName());
        response.put("status", record.getStatus());

        // Reconstruct probabilities
        Map<String, Double> probabilities = new LinkedHashMap<>();
        probabilities.put("NORM", record.getNormProbability());
        probabilities.put("MI", record.getMiProbability());
        probabilities.put("STTC", record.getSttcProbability());
        probabilities.put("CD", record.getCdProbability());
        probabilities.put("HYP", record.getHypProbability());

        // Find classification (highest probability)
        String classification = probabilities.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("UNKNOWN");

        double confidence = probabilities.getOrDefault(classification, 0.0);

        response.put("classification", classification);
        response.put("confidence", confidence);
        response.put("probabilities", probabilities);
        response.put("description", DESCRIPTIONS.getOrDefault(classification, "Classification completed"));

        if (record.getDoctor() != null) {
            response.put("technician", record.getDoctor().getName());
        }

        return response;
    }
}