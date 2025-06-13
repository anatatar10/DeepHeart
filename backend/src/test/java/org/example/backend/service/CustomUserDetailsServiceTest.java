// File: /Users/anatatar/Desktop/Licenta/deepheart/backend/src/test/java/org/example/backend/security/CustomUserDetailsServiceTest.java

package org.example.backend.service;

import org.example.backend.model.Role;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.example.backend.security.CustomUserDetailsService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomUserDetailsServiceTest {

    private UserRepository userRepository;
    private CustomUserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        userDetailsService = new CustomUserDetailsService(userRepository);
    }

    @Test
    void testLoadUserByUsername_Success() {
        // Given
        String email = "test@example.com";
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setPassword("encrypted_password");
        user.setRole(Role.ADMIN);

        Mockito.when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

        Assertions.assertNotNull(userDetails);
        Assertions.assertEquals(email, userDetails.getUsername());
        Assertions.assertEquals("encrypted_password", userDetails.getPassword());
        Assertions.assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void testLoadUserByUsername_UserNotFound() {
        String email = "nonexistent@example.com";

        Mockito.when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        Assertions.assertThrows(UsernameNotFoundException.class, () -> {
            userDetailsService.loadUserByUsername(email);
        });
    }
}