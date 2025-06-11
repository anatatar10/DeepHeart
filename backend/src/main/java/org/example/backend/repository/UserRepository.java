package org.example.backend.repository;

import org.example.backend.model.User;
import org.example.backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    // Basic user queries
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // Doctor-patient relationship queries
    long countByDoctor(User doctor);
    List<User> findByDoctor(User doctor);

    // Find all users by role
    List<User> findByRole(Role role);

    // Find patients by doctor - simplified version
    @Query("SELECT u FROM User u WHERE u.role = 'PATIENT' AND u.doctor.id = :doctorId")
    List<User> findPatientsByDoctorId(@Param("doctorId") UUID doctorId);

    // Find all doctors (using DOCTOR role)
    @Query("SELECT u FROM User u WHERE u.role = 'DOCTOR'")
    List<User> findAllDoctors();

    // Search patients by name
    @Query("SELECT u FROM User u WHERE u.role = 'PATIENT' AND LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<User> findPatientsByNameContaining(@Param("name") String name);
}