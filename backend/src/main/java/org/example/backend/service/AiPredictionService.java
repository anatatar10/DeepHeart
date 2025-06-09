package org.example.backend.service;

import org.springframework.stereotype.Service;

import java.io.*;

@Service
public class AiPredictionService {

    public String predictEcgImage(File imageFile) {
        try {
            System.out.println("🧠 Starting prediction for: " + imageFile.getAbsolutePath());

            ProcessBuilder pb = new ProcessBuilder(
                    "python3",
                    "/Users/anatatar/Desktop/Licenta/deepheart/ai_models/src/predict.py",
                    imageFile.getAbsolutePath()
            );
            pb.redirectErrorStream(true); // merge stderr into stdout

            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                System.out.println("📤 Python says: " + line); // debug each line
                output.append(line).append("\n");
            }

            int exitCode = process.waitFor();
            System.out.println("✅ Python exited with code: " + exitCode);
            String result = output.toString().trim();
            System.out.println("🔍 Final prediction string: " + result);

            return result;

        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
            return "Prediction failed: " + e.getMessage();
        }
    }
}
