package org.example.backend.dto;

import java.util.UUID;

public class SavedECGRecordDTO {
    private UUID id;
    private String fileName;
    private String classification;
    private double confidence;
    private String uploadTimestamp;
}