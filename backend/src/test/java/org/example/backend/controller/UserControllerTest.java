
package org.example.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.controller.UserController;
import org.example.backend.dto.UserRequestDTO;
import org.example.backend.model.Role;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.example.backend.security.CustomUserDetailsService;
import org.example.backend.security.JwtUtils;
import org.example.backend.service.EmailService;
import org.example.backend.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.time.LocalDate;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(SpringExtension.class)
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EmailService emailService;


    private User getSampleUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setName("John Doe");
        user.setUsername("johndoe");
        user.setEmail("johndoe@example.com");
        user.setPassword("hashedPassword");
        user.setBirthdate(LocalDate.of(1990, 1, 1));
        user.setPhone("123456789");
        user.setGender("MALE");
        user.setRole(Role.ADMIN);
        return user;
    }

    @Test
    void testCreateUser() throws Exception {
        UserRequestDTO userRequestDTO = new UserRequestDTO();
        userRequestDTO.setName("John Doe");
        userRequestDTO.setUsername("johndoe");
        userRequestDTO.setEmail("johndoe@example.com");
        userRequestDTO.setPassword("password123");

        User createdUser = getSampleUser();

        Mockito.when(userService.createUser(ArgumentMatchers.any(UserRequestDTO.class))).thenReturn(createdUser);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userRequestDTO))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.user("testuser").roles("ADMIN")))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.name").value("John Doe"));
    }

    @Test
    void testGetUserById_Found() throws Exception {
        User user = getSampleUser();

        Mockito.when(userService.getUserById(ArgumentMatchers.eq(user.getId()))).thenReturn(Optional.of(user));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/users/" + user.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user("testuser").roles("ADMIN")))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.email").value(user.getEmail()));
    }

    @Test
    void testGetUserById_NotFound() throws Exception {
        UUID id = UUID.randomUUID();
        Mockito.when(userService.getUserById(id)).thenReturn(Optional.empty());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/users/" + id)
                        .with(SecurityMockMvcRequestPostProcessors.user("testuser").roles("ADMIN")))
                .andExpect(MockMvcResultMatchers.status().isNotFound());
    }

    @Test
    void testGetAllUsers() throws Exception {
        List<User> users = List.of(getSampleUser());

        Mockito.when(userService.getAllUsers()).thenReturn(users);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/users")
                        .with(SecurityMockMvcRequestPostProcessors.user("testuser").roles("ADMIN")))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.length()").value(1));
    }

    @Test
    void testDeleteUser() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/users/" + id)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.user("testuser").roles("ADMIN")))
                .andExpect(MockMvcResultMatchers.status().isNoContent());
    }
}