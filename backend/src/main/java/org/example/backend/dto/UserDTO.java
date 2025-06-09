package org.example.backend.dto;

import java.time.LocalDate;
import java.util.UUID;

public class UserDTO {

    private UUID id;
    private String name;
    private String username;
    private String email;
    private String phone;
    private String gender;
    private LocalDate birthdate;
    private String role;

    // Constructors
    public UserDTO() {}

    public UserDTO(UUID id, String name, String username, String email, String phone, String gender, LocalDate birthdate, String role) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.email = email;
        this.phone = phone;
        this.gender = gender;
        this.birthdate = birthdate;
        this.role = role;
    }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public LocalDate getBirthdate() { return birthdate; }
    public void setBirthdate(LocalDate birthdate) { this.birthdate = birthdate; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
