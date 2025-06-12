package org.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.HashMap;
import java.util.Map;

@Service
public class AiPredictionService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String predictEcgImage(File imageFile) {
        try {
            System.out.println("Starting dual model prediction for: " + imageFile.getAbsolutePath());

            String denseNetResult = runDenseNetPrediction(imageFile);

            String resNetResult = runResNetPrediction(imageFile);

            return combineModelResults(denseNetResult, resNetResult);

        } catch (Exception e) {
            e.printStackTrace();
            return "{\"error\": \"Prediction failed: " + e.getMessage() + "\"}";
        }
    }

    // DenseNet prediction method
    private String runDenseNetPrediction(File imageFile) {
        try {
            System.out.println("🔬 Running DenseNet prediction...");

            ProcessBuilder pb = new ProcessBuilder(
                    "python3",
                    "/Users/anatatar/Desktop/Licenta/deepheart/ai_models/src/predict_densenet.py",
                    imageFile.getAbsolutePath()
            );
            pb.redirectErrorStream(true);

            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                System.out.println("DenseNet says: " + line);
                output.append(line).append("\n");
            }

            int exitCode = process.waitFor();
            System.out.println("DenseNet exited with code: " + exitCode);

            String result = output.toString().trim();
            System.out.println("DenseNet result: " + result);

            return result;

        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
            return "{\"error\": \"DenseNet prediction failed: " + e.getMessage() + "\"}";
        }
    }

    // ResNet prediction method
    private String runResNetPrediction(File imageFile) {
        try {
            System.out.println("Running ResNet prediction...");

            ProcessBuilder pb = new ProcessBuilder(
                    "python3",
                    "/Users/anatatar/Desktop/Licenta/deepheart/ai_models/src/predict_resnet.py",
                    imageFile.getAbsolutePath()
            );
            pb.redirectErrorStream(true);

            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                System.out.println("ResNet says: " + line);
                output.append(line).append("\n");
            }

            int exitCode = process.waitFor();
            System.out.println("ResNet exited with code: " + exitCode);

            String result = output.toString().trim();
            System.out.println("ResNet result: " + result);

            return result;

        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
            return "{\"error\": \"ResNet prediction failed: " + e.getMessage() + "\"}";
        }
    }

    // Combine results from both models
    private String combineModelResults(String denseNetResult, String resNetResult) {
        try {
            // Parse JSON results
            JsonNode denseNetJson = objectMapper.readTree(denseNetResult);
            JsonNode resNetJson = objectMapper.readTree(resNetResult);

            // Create combined result
            Map<String, Object> combinedResult = new HashMap<>();

            // Add individual model results
            combinedResult.put("model1", denseNetJson);  // Keep "model1" for compatibility
            combinedResult.put("model2", resNetJson);

            // Create ensemble prediction (average probabilities)
            Map<String, Object> ensemblePrediction = createEnsemblePrediction(denseNetJson, resNetJson);
            combinedResult.put("ensemble", ensemblePrediction);

            // Primary result (for backward compatibility)
            combinedResult.put("classification", ensemblePrediction.get("classification"));
            combinedResult.put("confidence", ensemblePrediction.get("confidence"));
            combinedResult.put("probabilities", ensemblePrediction.get("probabilities"));
            combinedResult.put("description", ensemblePrediction.get("description"));

            // Add metadata
            combinedResult.put("prediction_method", "dual_model_ensemble");
            combinedResult.put("models_used", new String[]{"DenseNet121", "ResNet"});

            return objectMapper.writeValueAsString(combinedResult);

        } catch (Exception e) {
            e.printStackTrace();
            return "{\"error\": \"Failed to combine model results: " + e.getMessage() + "\"}";
        }
    }

    // Create ensemble prediction by averaging probabilities
    private Map<String, Object> createEnsemblePrediction(JsonNode denseNet, JsonNode resNet) {
        try {
            Map<String, Object> ensemble = new HashMap<>();

            // Get probabilities from both models
            JsonNode denseNetProbs = denseNet.get("probabilities");
            JsonNode resNetProbs = resNet.get("probabilities");

            // Average the probabilities
            Map<String, Double> avgProbs = new HashMap<>();
            String[] labels = {"NORM", "MI", "STTC", "CD", "HYP"};

            for (String label : labels) {
                double denseNetProb = denseNetProbs.get(label).asDouble();
                double resNetProb = resNetProbs.get(label).asDouble();
                avgProbs.put(label, Math.round((denseNetProb + resNetProb) / 2.0 * 100.0) / 100.0);
            }

            // Find primary diagnosis
            String primaryCondition = avgProbs.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .get().getKey();

            double primaryConfidence = avgProbs.get(primaryCondition);

            // Determine confidence level
            String confidenceLevel;
            String clinicalRecommendation;
            if (primaryConfidence >= 70) {
                confidenceLevel = "High";
                clinicalRecommendation = "High confidence in ensemble diagnosis";
            } else if (primaryConfidence >= 50) {
                confidenceLevel = "Medium";
                clinicalRecommendation = "Moderate confidence - consider clinical correlation";
            } else if (primaryConfidence >= 30) {
                confidenceLevel = "Low";
                clinicalRecommendation = "Low confidence - requires clinical evaluation";
            } else {
                confidenceLevel = "Very Low";
                clinicalRecommendation = "Very low confidence - manual review recommended";
            }

            // Build ensemble result
            ensemble.put("classification", primaryCondition);
            ensemble.put("confidence", primaryConfidence);
            ensemble.put("probabilities", avgProbs);
            ensemble.put("description", getDescription(primaryCondition));
            ensemble.put("confidence_level", confidenceLevel);
            ensemble.put("clinical_recommendation", clinicalRecommendation);

            // Add model agreement info
            String denseNetPrimary = denseNet.get("classification").asText();
            String resNetPrimary = resNet.get("classification").asText();
            boolean agree = denseNetPrimary.equals(resNetPrimary);

            Map<String, Object> agreement = new HashMap<>();
            agreement.put("models_agree", agree);
            agreement.put("densenet_primary", denseNetPrimary);
            agreement.put("resnet_primary", resNetPrimary);
            if (agree) {
                agreement.put("agreement_note", "Both models agree on primary diagnosis");
            } else {
                agreement.put("agreement_note", "Models disagree on primary diagnosis - ensemble used");
            }
            ensemble.put("model_agreement", agreement);

            return ensemble;

        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", "Failed to create ensemble: " + e.getMessage());
            return errorResult;
        }
    }

    // Helper method to get clinical descriptions
    private String getDescription(String condition) {
        switch (condition) {
            case "NORM": return "Normal ECG - No significant abnormalities detected";
            case "MI": return "Myocardial Infarction - Heart attack indicators present";
            case "STTC": return "ST/T wave changes - May indicate ischemia or other cardiac conditions";
            case "CD": return "Conduction Disorders - Abnormal electrical conduction patterns";
            case "HYP": return "Hypertrophy - Enlarged heart chambers detected";
            default: return "Unknown condition";
        }
    }
}