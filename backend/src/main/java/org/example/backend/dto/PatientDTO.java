package org.example.backend.dto;

import java.time.LocalDate;
import java.util.UUID;

public class PatientDTO {
    private UUID id;
    private String patientId;
    private String name;
    private String email;
    private String phone;
    private LocalDate birthdate;
    private Integer age;
    private String gender;
    private String smokingStatus;
    private String bloodPressure;
    private String[] medicalHistory;
    private LocalDate registrationDate;
    private String doctorName;
    private UUID doctorId;

    // Constructors
    public PatientDTO() {}

    public PatientDTO(UUID id, String patientId, String name, String email, String phone,
                      LocalDate birthdate, Integer age, String gender, String smokingStatus,
                      String bloodPressure, String[] medicalHistory, LocalDate registrationDate,
                      String doctorName, UUID doctorId) {
        this.id = id;
        this.patientId = patientId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.birthdate = birthdate;
        this.age = age;
        this.gender = gender;
        this.smokingStatus = smokingStatus;
        this.bloodPressure = bloodPressure;
        this.medicalHistory = medicalHistory;
        this.registrationDate = registrationDate;
        this.doctorName = doctorName;
        this.doctorId = doctorId;
    }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDate getBirthdate() { return birthdate; }
    public void setBirthdate(LocalDate birthdate) { this.birthdate = birthdate; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getSmokingStatus() { return smokingStatus; }
    public void setSmokingStatus(String smokingStatus) { this.smokingStatus = smokingStatus; }

    public String getBloodPressure() { return bloodPressure; }
    public void setBloodPressure(String bloodPressure) { this.bloodPressure = bloodPressure; }

    public String[] getMedicalHistory() { return medicalHistory; }
    public void setMedicalHistory(String[] medicalHistory) { this.medicalHistory = medicalHistory; }

    public LocalDate getRegistrationDate() { return registrationDate; }
    public void setRegistrationDate(LocalDate registrationDate) { this.registrationDate = registrationDate; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public UUID getDoctorId() { return doctorId; }
    public void setDoctorId(UUID doctorId) { this.doctorId = doctorId; }
}