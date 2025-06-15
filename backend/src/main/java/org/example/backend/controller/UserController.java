package org.example.backend.controller;

import org.example.backend.dto.UserRequestDTO;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.example.backend.security.CustomUserDetailsService;
import org.example.backend.security.JwtUtils;
import org.example.backend.service.EmailService;
import org.example.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // optional, adjust for production
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final CustomUserDetailsService userDetailsService;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;


    public UserController(
            UserService userService,
            UserRepository userRepository,
            CustomUserDetailsService userDetailsService,
            JwtUtils jwtUtils,
            PasswordEncoder passwordEncoder,
            EmailService emailService
    ) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody UserRequestDTO userDTO) {
        User createdUser = userService.createUser(userDTO);
        return ResponseEntity.ok(createdUser);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable UUID id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/by-id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable UUID id, @RequestBody UserRequestDTO userDTO)
    {
        User updatedUser = userService.updateUser(id, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateOwnProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UserRequestDTO userDTO
    ) {
        try {
            String token = authHeader.replace("Bearer ", "").trim();
            String userId = jwtUtils.getUserIdFromToken(token);

            UUID uuid = UUID.fromString(userId);

            User updatedUser = userService.updateUser(uuid, userDTO);

            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update profile");
        }
    }



    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody UserRequestDTO userDTO) {
        try {
            User createdUser = userService.registerUser(userDTO);
            return ResponseEntity.ok(createdUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String password = loginData.get("password");

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Invalid email"));
        }

        User user = userOptional.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Invalid password"));
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwt = jwtUtils.generateJwtToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name(),
                user.getName()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("token", jwt);

        return ResponseEntity.ok(response);
    }


    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            System.out.println("📧 Processing forgot password for email: " + email);

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Collections.singletonMap("message", "Email is required"));
            }

            // Check if user exists
            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty()) {
                System.out.println("User not found for email: " + email);
                // For security, don't reveal if email exists or not
                return ResponseEntity.ok()
                        .body(Collections.singletonMap("message", "If the email exists, a reset link has been sent"));
            }

            User user = userOptional.get();
            System.out.println("User found: " + user.getEmail());

            // Generate reset token and set expiry (1 hour from now)
            String resetToken = UUID.randomUUID().toString();
            LocalDateTime expiryTime = LocalDateTime.now().plusHours(1);

            // Save token to database
            user.setResetToken(resetToken);
            user.setResetTokenExpiry(expiryTime);
            userRepository.save(user);

            System.out.println("Generated and saved reset token: " + resetToken);
            System.out.println("Token expires at: " + expiryTime);

            // Send email
            emailService.sendPasswordResetEmail(email, resetToken);

            return ResponseEntity.ok()
                    .body(Collections.singletonMap("message", "Password reset instructions sent to your email"));

        } catch (Exception e) {
            System.err.println("Error in forgot password: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "An error occurred while processing your request"));
        }
    }

    @PostMapping("/verify-reset-token")
    public ResponseEntity<?> verifyResetToken(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            System.out.println("🔍 Verifying reset token: " + token);

            if (token == null || token.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Collections.singletonMap("message", "Token is required"));
            }

            // Find user by reset token
            Optional<User> userOptional = userRepository.findByResetToken(token);
            if (userOptional.isEmpty()) {
                System.out.println("No user found with reset token: " + token);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "Invalid reset token"));
            }

            User user = userOptional.get();

            // Check if token is expired
            if (user.isResetTokenExpired()) {
                System.out.println("Reset token expired for user: " + user.getEmail());
                // Clear expired token
                user.setResetToken(null);
                user.setResetTokenExpiry(null);
                userRepository.save(user);

                return ResponseEntity.status(HttpStatus.GONE)
                        .body(Collections.singletonMap("message", "Reset token has expired. Please request a new password reset."));
            }

            System.out.println("Token verified successfully for user: " + user.getEmail());
            return ResponseEntity.ok()
                    .body(Collections.singletonMap("message", "Token is valid"));

        } catch (Exception e) {
            System.err.println("Error verifying reset token: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "An error occurred while verifying token"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            System.out.println("Processing password reset with token: " + token);

            if (token == null || token.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Collections.singletonMap("message", "Token is required"));
            }

            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                        .body(Collections.singletonMap("message", "Password must be at least 6 characters long"));
            }

            // Find user by reset token
            Optional<User> userOptional = userRepository.findByResetToken(token);
            if (userOptional.isEmpty()) {
                System.out.println("No user found with reset token: " + token);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "Invalid reset token"));
            }

            User user = userOptional.get();

            // Check if token is expired
            if (user.isResetTokenExpired()) {
                System.out.println("Reset token expired for user: " + user.getEmail());
                // Clear expired token
                user.setResetToken(null);
                user.setResetTokenExpiry(null);
                userRepository.save(user);

                return ResponseEntity.status(HttpStatus.GONE)
                        .body(Collections.singletonMap("message", "Reset token has expired. Please request a new password reset."));
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);

            System.out.println("Password reset successful for user: " + user.getEmail());

            emailService.sendPasswordResetConfirmation(user.getEmail());

            return ResponseEntity.ok()
                    .body(Collections.singletonMap("message", "Password has been reset successfully"));

        } catch (Exception e) {
            System.err.println("Error resetting password: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "An error occurred while resetting password"));
        }
    }
}