package org.example.backend.mapper;

import org.example.backend.dto.UserDTO;
import org.example.backend.dto.UserRequestDTO;
import org.example.backend.model.Role;
import org.example.backend.model.User;

public class UserMapper {

    public static UserDTO toDTO(User user) {
        if (user == null) return null;

        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setGender(user.getGender());
        dto.setBirthdate(user.getBirthdate());
        dto.setRole(user.getRole().name());

        return dto;
    }

    public static User toEntity(UserDTO dto) {
        if (dto == null) return null;

        User user = new User();
        user.setName(dto.getName());
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setGender(dto.getGender());
        user.setBirthdate(dto.getBirthdate());
        // ⚠️ You should not set ID or password here unless you're updating an existing user
        // ⚠️ Also make sure to map the string role to your Role enum
        return user;
    }

    public static User fromRequestDTO(UserRequestDTO dto) {
        if (dto == null) return null;

        User user = new User();
        user.setName(dto.getName());
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        user.setPhone(dto.getPhone());
        user.setGender(dto.getGender());
        user.setBirthdate(dto.getBirthdate());

        try {
            user.setRole(Enum.valueOf(Role.class, dto.getRole().toUpperCase()));
        } catch (IllegalArgumentException e) {
            user.setRole(Role.PATIENT); // Default fallback
        }

        return user;
    }

}
