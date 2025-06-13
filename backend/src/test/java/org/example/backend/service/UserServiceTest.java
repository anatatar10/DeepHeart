package org.example.backend.service;

import org.assertj.core.api.Assertions;
import org.example.backend.dto.UserRequestDTO;
import org.example.backend.model.Role;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.example.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

public class UserServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        passwordEncoder = Mockito.mock(PasswordEncoder.class);
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    void testGetUserById() {
        User user = new User();
        user.setUsername("testuser");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());

        Mockito.when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        Optional<User> result = userService.getUserById(user.getId());

        Assertions.assertThat(result).isPresent();
        Assertions.assertThat(result.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    void testCreateUser() {
        UserRequestDTO dto = new UserRequestDTO();
        dto.setUsername("john_doe");
        dto.setEmail("john@example.com");
        dto.setPassword("securepass");
        dto.setRole("PATIENT");
        dto.setName("John Doe");
        dto.setPhone("123456");
        dto.setGender("Male");
        dto.setBirthdate(LocalDate.of(1990, 1, 1));

        Mockito.when(passwordEncoder.encode(dto.getPassword())).thenReturn("encodedPassword");
        Mockito.when(userRepository.save(ArgumentMatchers.any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User createdUser = userService.createUser(dto);

        Assertions.assertThat(createdUser.getUsername()).isEqualTo("john_doe");
        Assertions.assertThat(createdUser.getRole()).isEqualTo(Role.PATIENT);
        Assertions.assertThat(createdUser.getPassword()).isEqualTo("encodedPassword");
    }

    @Test
    void testRegisterUser_Success() {
        UserRequestDTO dto = buildValidDTO();

        Mockito.when(userRepository.existsByUsername(dto.getUsername())).thenReturn(false);
        Mockito.when(userRepository.existsByEmail(dto.getEmail())).thenReturn(false);
        Mockito.when(passwordEncoder.encode(dto.getPassword())).thenReturn("encodedPassword");
        Mockito.when(userRepository.save(ArgumentMatchers.any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User registeredUser = userService.registerUser(dto);

        Assertions.assertThat(registeredUser.getUsername()).isEqualTo(dto.getUsername());
        Assertions.assertThat(registeredUser.getPassword()).isEqualTo("encodedPassword");
    }

    @Test
    void testRegisterUser_UsernameExists() {
        UserRequestDTO dto = buildValidDTO();
        Mockito.when(userRepository.existsByUsername(dto.getUsername())).thenReturn(true);

        Assertions.assertThatThrownBy(() -> userService.registerUser(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Username already taken!");
    }

    @Test
    void testRegisterUser_EmailExists() {
        UserRequestDTO dto = buildValidDTO();
        Mockito.when(userRepository.existsByUsername(dto.getUsername())).thenReturn(false);
        Mockito.when(userRepository.existsByEmail(dto.getEmail())).thenReturn(true);

        Assertions.assertThatThrownBy(() -> userService.registerUser(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email already in use!");
    }

    @Test
    void testRegisterUser_PasswordTooShort() {
        UserRequestDTO dto = buildValidDTO();
        dto.setPassword("123");  // too short
        Mockito.when(userRepository.existsByUsername(dto.getUsername())).thenReturn(false);
        Mockito.when(userRepository.existsByEmail(dto.getEmail())).thenReturn(false);

        Assertions.assertThatThrownBy(() -> userService.registerUser(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Password must be at least 6 characters.");
    }

    @Test
    void testGetAllUsers() {
        User user1 = new User();
        user1.setUsername("user1");
        User user2 = new User();
        user2.setUsername("user2");

        Mockito.when(userRepository.findAll()).thenReturn(Arrays.asList(user1, user2));

        List<User> users = userService.getAllUsers();

        Assertions.assertThat(users).hasSize(2);
    }

    @Test
    void testDeleteUser() {
        UUID userId = UUID.randomUUID();

        userService.deleteUser(userId);

        Mockito.verify(userRepository, Mockito.times(1)).deleteById(userId);
    }

    private UserRequestDTO buildValidDTO() {
        UserRequestDTO dto = new UserRequestDTO();
        dto.setUsername("newuser");
        dto.setEmail("newuser@example.com");
        dto.setPassword("validPassword");
        dto.setRole("DOCTOR");
        dto.setName("New User");
        dto.setPhone("555-1234");
        dto.setGender("Female");
        dto.setBirthdate(LocalDate.of(1985, 5, 15));
        return dto;
    }
}