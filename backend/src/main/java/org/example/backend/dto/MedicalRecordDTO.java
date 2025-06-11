package org.example.backend.dto;

import java.util.UUID;

public class MedicalRecordDTO {
    private UUID id;
    private UUID patientId;
    private String date;
    private String diagnosis;
    private String treatment;
    private String medications;
    private String notes;
    private String doctorName;
    private String visitType;
    private VitalSignsDTO vitalSigns;
}