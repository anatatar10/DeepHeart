package org.example.backend.dto;

import java.time.LocalDate;
import java.util.List;

public class UserRequestDTO {

    private String name;
    private String username;
    private String email;
    private String password;
    private String phone;
    private String gender;
    private LocalDate birthdate;
    private String role;

    private String smokingStatus;
    private String bloodPressure;
    private List<String> medicalHistory;

    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public LocalDate getBirthdate() { return birthdate; }
    public void setBirthdate(LocalDate birthdate) { this.birthdate = birthdate; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getSmokingStatus() { return smokingStatus; }
    public void setSmokingStatus(String smokingStatus) { this.smokingStatus = smokingStatus; }

    public String getBloodPressure() { return bloodPressure; }
    public void setBloodPressure(String bloodPressure) { this.bloodPressure = bloodPressure; }

    public List<String> getMedicalHistory() { return medicalHistory; }
    public void setMedicalHistory(List<String> medicalHistory) { this.medicalHistory = medicalHistory; }
}