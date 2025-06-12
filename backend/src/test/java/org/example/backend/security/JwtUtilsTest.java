package org.example.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    public void setup() {
        jwtUtils = new JwtUtils();
    }

    @Test
    public void testGenerateAndValidateToken() {
        String username = "doctor@test.com";
        String token = jwtUtils.generateJwtToken(username);

        assertNotNull(token);
        assertTrue(jwtUtils.validateJwtToken(token));
        assertEquals(username, jwtUtils.getUsernameFromJwtToken(token));
    }

    @Test
    public void testValidateEmptyToken() {
        String emptyToken = "";
        assertFalse(jwtUtils.validateJwtToken(emptyToken));
    }

    @Test
    public void testValidateNullToken() {
        assertFalse(jwtUtils.validateJwtToken(null));
    }
}