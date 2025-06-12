package org.example.backend.service;

import org.example.backend.dto.UserRequestDTO;
import org.example.backend.model.Role;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    void testGetUserById() {
        User user = new User();
        user.setUsername("testuser");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        Optional<User> result = userService.getUserById(user.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("testuser");
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

        when(passwordEncoder.encode(dto.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User createdUser = userService.createUser(dto);

        assertThat(createdUser.getUsername()).isEqualTo("john_doe");
        assertThat(createdUser.getRole()).isEqualTo(Role.PATIENT);
        assertThat(createdUser.getPassword()).isEqualTo("encodedPassword");
    }

    @Test
    void testRegisterUser_Success() {
        UserRequestDTO dto = buildValidDTO();

        when(userRepository.existsByUsername(dto.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(dto.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(dto.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User registeredUser = userService.registerUser(dto);

        assertThat(registeredUser.getUsername()).isEqualTo(dto.getUsername());
        assertThat(registeredUser.getPassword()).isEqualTo("encodedPassword");
    }

    @Test
    void testRegisterUser_UsernameExists() {
        UserRequestDTO dto = buildValidDTO();
        when(userRepository.existsByUsername(dto.getUsername())).thenReturn(true);

        assertThatThrownBy(() -> userService.registerUser(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Username already taken!");
    }

    @Test
    void testRegisterUser_EmailExists() {
        UserRequestDTO dto = buildValidDTO();
        when(userRepository.existsByUsername(dto.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(dto.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> userService.registerUser(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email already in use!");
    }

    @Test
    void testRegisterUser_PasswordTooShort() {
        UserRequestDTO dto = buildValidDTO();
        dto.setPassword("123");  // too short
        when(userRepository.existsByUsername(dto.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(dto.getEmail())).thenReturn(false);

        assertThatThrownBy(() -> userService.registerUser(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Password must be at least 6 characters.");
    }

    @Test
    void testGetAllUsers() {
        User user1 = new User();
        user1.setUsername("user1");
        User user2 = new User();
        user2.setUsername("user2");

        when(userRepository.findAll()).thenReturn(Arrays.asList(user1, user2));

        List<User> users = userService.getAllUsers();

        assertThat(users).hasSize(2);
    }

    @Test
    void testDeleteUser() {
        UUID userId = UUID.randomUUID();

        userService.deleteUser(userId);

        verify(userRepository, times(1)).deleteById(userId);
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