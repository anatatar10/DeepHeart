package org.example.backend.service;

import org.example.backend.dto.PatientDTO;
import org.example.backend.model.Role;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PatientService {

    @Autowired
    private UserRepository userRepository;

    public List<PatientDTO> getAllPatients() {
        List<User> patients = userRepository.findByRole(Role.PATIENT);
        return patients.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PatientDTO> getPatientsByDoctor(UUID doctorId) {
        List<User> patients = userRepository.findPatientsByDoctorId(doctorId);
        return patients.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<PatientDTO> getPatientById(UUID id) {
        Optional<User> patient = userRepository.findById(id);
        return patient.filter(user -> user.getRole() == Role.PATIENT)
                .map(this::convertToDTO);
    }

    public PatientDTO createPatient(PatientDTO patientDTO) {
        User patient = new User();
        patient.setUsername(generateUsername(patientDTO.getName()));
        patient.setEmail(patientDTO.getEmail());
        patient.setPassword("temp123"); // Should be hashed in real implementation
        patient.setRole(Role.PATIENT);
        patient.setName(patientDTO.getName());
        patient.setPhone(patientDTO.getPhone());
        patient.setBirthdate(patientDTO.getBirthdate());
        patient.setGender(patientDTO.getGender());
        patient.setRegistrationDate(LocalDate.now());
        patient.setBloodPressure(patientDTO.getBloodPressure());
        patient.setSmokingStatus(patientDTO.getSmokingStatus());


        // Set doctor if provided
        if (patientDTO.getDoctorId() != null) {
            Optional<User> doctor = userRepository.findById(patientDTO.getDoctorId());
            if (doctor.isPresent() && doctor.get().getRole() == Role.DOCTOR) {
                patient.setDoctor(doctor.get());
                System.out.println("✅ Assigned patient to doctor: " + doctor.get().getName());
            } else {
                System.out.println("⚠️ Doctor not found or invalid role for ID: " + patientDTO.getDoctorId());
            }
        }
        System.out.println("📋 Saving patient:");
        System.out.println("🩸 BP: " + patient.getBloodPressure());
        System.out.println("🚬 Smoking: " + patient.getSmokingStatus());
        System.out.println("👤 Name: " + patient.getName());
        System.out.println("📧 Email: " + patient.getEmail());
        User savedPatient = userRepository.save(patient);
        System.out.println("✅ Created patient: " + savedPatient.getName() +
                (savedPatient.getDoctor() != null ? " (assigned to " + savedPatient.getDoctor().getName() + ")" : " (no doctor assigned)"));

        return convertToDTO(savedPatient);
    }

    public PatientDTO updatePatient(UUID id, PatientDTO patientDTO) {
        Optional<User> existingPatient = userRepository.findById(id);
        if (existingPatient.isPresent() && existingPatient.get().getRole() == Role.PATIENT) {
            User patient = existingPatient.get();
            patient.setName(patientDTO.getName());
            patient.setEmail(patientDTO.getEmail());
            patient.setPhone(patientDTO.getPhone());
            patient.setBirthdate(patientDTO.getBirthdate());
            patient.setGender(patientDTO.getGender());
            patient.setBloodPressure(patientDTO.getBloodPressure());
            patient.setSmokingStatus(patientDTO.getSmokingStatus());

            // Update doctor if provided
            if (patientDTO.getDoctorId() != null) {
                Optional<User> doctor = userRepository.findById(patientDTO.getDoctorId());
                doctor.ifPresent(patient::setDoctor);
            }
            System.out.println("📋 Saving patient:");
            System.out.println("🩸 BP: " + patient.getBloodPressure());
            System.out.println("🚬 Smoking: " + patient.getSmokingStatus());
            System.out.println("👤 Name: " + patient.getName());
            System.out.println("📧 Email: " + patient.getEmail());
            User updatedPatient = userRepository.save(patient);
            return convertToDTO(updatedPatient);
        }
        return null;
    }

    public boolean deletePatient(UUID id) {
        Optional<User> patient = userRepository.findById(id);
        if (patient.isPresent() && patient.get().getRole() == Role.PATIENT) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<PatientDTO> searchPatients(String name) {
        List<User> patients = userRepository.findPatientsByNameContaining(name);
        return patients.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private PatientDTO convertToDTO(User user) {
        PatientDTO dto = new PatientDTO();
        dto.setId(user.getId());
        dto.setPatientId(generatePatientId(user));
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setBirthdate(user.getBirthdate());
        dto.setAge(calculateAge(user.getBirthdate()));
        dto.setGender(user.getGender());

        // Use actual data from user entity
        dto.setSmokingStatus(user.getSmokingStatus() != null ? user.getSmokingStatus() : "Unknown");
        dto.setBloodPressure(user.getBloodPressure() != null ? user.getBloodPressure() : "N/A");
        dto.setMedicalHistory(user.getMedicalHistory() != null ?
                user.getMedicalHistory().toArray(new String[0]) : new String[]{});
        dto.setRegistrationDate(user.getRegistrationDate() != null ?
                user.getRegistrationDate() : LocalDate.now());

        if (user.getDoctor() != null) {
            dto.setDoctorName(user.getDoctor().getName());
            dto.setDoctorId(user.getDoctor().getId());
        }

        return dto;
    }

    private Integer calculateAge(LocalDate birthdate) {
        if (birthdate == null) return null;
        return Period.between(birthdate, LocalDate.now()).getYears();
    }

    private String generatePatientId(User user) {
        // Simple sequential numbering based on when patient was created
        // This creates clean IDs like PAT001, PAT002, PAT003, etc.
        String userId = user.getId().toString().replaceAll("-", "");
        int hashCode = Math.abs(userId.hashCode());
        int patientNumber = (hashCode % 9999) + 1; // Ensures number between 1-9999
        return String.format("PAT%03d", patientNumber);
    }

    private String generateUsername(String name) {
        // Generate username from name
        return name.toLowerCase().replaceAll(" ", ".") + System.currentTimeMillis() % 1000;
    }

    public PatientDTO getPatientByEmail(String email) {
        Optional<User> patient = userRepository.findByEmail(email);
        if (patient.isPresent() && patient.get().getRole() == Role.PATIENT) {
            return convertToDTO(patient.get());
        }
        throw new RuntimeException("Patient not found for email: " + email);
    }


}