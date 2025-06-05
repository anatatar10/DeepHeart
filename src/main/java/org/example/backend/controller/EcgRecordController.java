package org.example.backend.controller;

import org.example.backend.model.EcgRecord;
import org.example.backend.model.User;
import org.example.backend.service.EcgRecordService;
import org.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ecg")
@CrossOrigin(origins = "*")
public class EcgRecordController {

    @Autowired
    private EcgRecordService ecgRecordService;

    private UserService userService;

    @GetMapping("/user/{userId}")
    public List<EcgRecord> getAllByUser(@PathVariable UUID userId) {
        return ecgRecordService.getAllByUserId(userId);
    }

    @PostMapping
    public EcgRecord addEcg(@RequestBody EcgRecord ecgRecord) {
        return ecgRecordService.save(ecgRecord);
    }

    @DeleteMapping("/{id}")
    public void deleteEcg(@PathVariable UUID id) {
        ecgRecordService.delete(id);
    }

    @GetMapping("/{id}")
    public EcgRecord getById(@PathVariable UUID id) {
        return ecgRecordService.getById(id);
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadEcg(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") UUID userId) {

        try {
            // Check file type
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || (!originalFilename.endsWith(".png") &&
                    !originalFilename.endsWith(".jpg") &&
                    !originalFilename.endsWith(".jpeg"))) {
                return ResponseEntity.badRequest().body("Unsupported file format.");
            }

            // Save to local folder
            String uploadDir = "uploads/";
            String filename = UUID.randomUUID() + "_" + originalFilename;
            Path path = Paths.get(uploadDir + filename);
            Files.copy(file.getInputStream(), path);

            // Get user
            User user = userService.getById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body("Invalid user ID.");
            }

            // Save EcgRecord
            EcgRecord ecgRecord = new EcgRecord(user, filename, "Pending");
            ecgRecordService.save(ecgRecord);

            return ResponseEntity.ok("ECG uploaded successfully!");

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

}
