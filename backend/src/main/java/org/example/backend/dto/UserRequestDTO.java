package org.example.backend.dto;

import java.time.LocalDate;

public class UserRequestDTO {

    private String name;
    private String username;
    private String email;
    private String password;
    private String phone;
    private String gender;
    private LocalDate birthdate;
    private String role; // Store as String for flexibility

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
}
