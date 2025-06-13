package org.example.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    // Same secret key (long enough for HS256)
    private static final String jwtSecret = "mySecretKeyForJWTTokenGenerationThatIsLongEnoughForHS256AlgorithmToWorkProperly123456789";
    private final SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    private final long jwtExpirationMs = 86400000; // 1 day

    // ✅ Modified: Generate token with full user info
    public String generateJwtToken(String userId, String email, String role, String name) {
        logger.info("Generating JWT for user: {}", email);

        try {
            String token = Jwts.builder()
                    .setSubject(email)
                    .claim("id", userId)
                    .claim("role", role)
                    .claim("name", name)
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                    .signWith(key, SignatureAlgorithm.HS256)
                    .compact();
            logger.info("Generated token successfully for user: {}", email);
            return token;
        } catch (Exception e) {
            logger.error("Error generating JWT token: ", e);
            throw new RuntimeException("Could not generate JWT token", e);
        }
    }

    // ✅ Get username (email) from token
    public String getUsernameFromJwtToken(String token) {
        return parseClaims(token).getSubject();
    }

    // ✅ Get userId directly
    public String getUserIdFromToken(String token) {
        return parseClaims(token).get("id", String.class);
    }

    // ✅ Get role
    public String getRoleFromToken(String token) {
        return parseClaims(token).get("role", String.class);
    }

    // ✅ Common parser
    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean validateJwtToken(String token) {
        logger.info("Validating JWT token");
        try {
            if (token == null || token.trim().isEmpty()) {
                logger.error("JWT token is null or empty");
                return false;
            }

            parseClaims(token);
            logger.info("JWT token validation successful");
            return true;
        } catch (Exception e) {
            logger.error("JWT token validation failed: {}", e.getMessage());
            return false;
        }
    }
}