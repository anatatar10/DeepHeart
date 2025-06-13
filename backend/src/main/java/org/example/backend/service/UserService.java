package org.example.backend.service;

import org.example.backend.dto.UserRequestDTO;
import org.example.backend.model.Role;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(UserRequestDTO dto) {
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(Role.valueOf(dto.getRole().toUpperCase()));
        user.setName(dto.getName());
        user.setPhone(dto.getPhone());
        user.setGender(dto.getGender());
        user.setBirthdate(dto.getBirthdate());
        return userRepository.save(user);
    }

    public Optional<User> getUserById(UUID id) {
        return userRepository.findById(id);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }

    public User registerUser(UserRequestDTO dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username already taken!");
        }

        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already in use!");
        }

        if (dto.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        return createUser(dto);
    }

    public User updateUser(UUID id, UserRequestDTO userDTO) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            throw new NoSuchElementException("User not found");
        }

        User user = optionalUser.get();

        if (userDTO.getName() != null) user.setName(userDTO.getName());
        if (userDTO.getUsername() != null) user.setUsername(userDTO.getUsername());
        if (userDTO.getEmail() != null) user.setEmail(userDTO.getEmail());
        if (userDTO.getPhone() != null) user.setPhone(userDTO.getPhone());
        if (userDTO.getGender() != null) user.setGender(userDTO.getGender());
        if (userDTO.getBirthdate() != null) user.setBirthdate(userDTO.getBirthdate());
        if (userDTO.getSmokingStatus() != null) user.setSmokingStatus(userDTO.getSmokingStatus());
        if (userDTO.getBloodPressure() != null) user.setBloodPressure(userDTO.getBloodPressure());
        if (userDTO.getMedicalHistory() != null) user.setMedicalHistory(userDTO.getMedicalHistory());

        // Role mapping (string to enum)
        if (userDTO.getRole() != null) {
            user.setRole(Role.valueOf(userDTO.getRole().toUpperCase()));
        }

        return userRepository.save(user);
    }
}