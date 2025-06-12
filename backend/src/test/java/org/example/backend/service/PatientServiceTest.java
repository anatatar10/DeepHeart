package org.example.backend.service;

import org.example.backend.dto.PatientDTO;
import org.example.backend.model.Role;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

public class PatientServiceTest {

    private UserRepository userRepository;
    private PatientService patientService;

    @BeforeEach
    public void setup() {
        userRepository = mock(UserRepository.class);
        patientService = new PatientService();
        ReflectionTestUtils.setField(patientService, "userRepository", userRepository);
    }

    @Test
    public void testGetAllPatients() {
        User patient = createMockPatient();
        List<User> patients = List.of(patient);

        when(userRepository.findByRole(Role.PATIENT)).thenReturn(patients);

        List<PatientDTO> result = patientService.getAllPatients();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Patient Name");
    }

    @Test
    public void testGetPatientsByDoctor() {
        UUID doctorId = UUID.randomUUID();
        User patient = createMockPatient();

        when(userRepository.findPatientsByDoctorId(doctorId)).thenReturn(List.of(patient));

        List<PatientDTO> result = patientService.getPatientsByDoctor(doctorId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEmail()).isEqualTo("patient@example.com");
    }

    @Test
    public void testGetPatientById_Found() {
        User patient = createMockPatient();
        UUID id = UUID.randomUUID();
        ReflectionTestUtils.setField(patient, "id", id);

        when(userRepository.findById(id)).thenReturn(Optional.of(patient));

        Optional<PatientDTO> result = patientService.getPatientById(id);
        assertThat(result).isPresent();
        assertThat(result.get().getGender()).isEqualTo("Female");
    }

    @Test
    public void testGetPatientById_NotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        Optional<PatientDTO> result = patientService.getPatientById(id);
        assertThat(result).isEmpty();
    }

    @Test
    public void testCreatePatient_NoDoctor() {
        PatientDTO dto = buildPatientDTO();
        User savedPatient = createMockPatient();

        when(userRepository.save(any(User.class))).thenReturn(savedPatient);

        PatientDTO result = patientService.createPatient(dto);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo(dto.getName());
    }

    @Test
    public void testUpdatePatient_Success() {
        UUID id = UUID.randomUUID();
        User existing = createMockPatient();
        ReflectionTestUtils.setField(existing, "id", id);

        PatientDTO dto = buildPatientDTO();
        dto.setName("Updated Name");

        when(userRepository.findById(id)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenReturn(existing);

        PatientDTO result = patientService.updatePatient(id, dto);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Updated Name");
    }

    @Test
    public void testDeletePatient_Success() {
        UUID id = UUID.randomUUID();
        User existing = createMockPatient();
        ReflectionTestUtils.setField(existing, "id", id);

        when(userRepository.findById(id)).thenReturn(Optional.of(existing));

        boolean deleted = patientService.deletePatient(id);

        assertThat(deleted).isTrue();
        verify(userRepository, times(1)).deleteById(id);
    }

    @Test
    public void testDeletePatient_NotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        boolean deleted = patientService.deletePatient(id);

        assertThat(deleted).isFalse();
    }

    @Test
    public void testSearchPatients() {
        User patient = createMockPatient();
        when(userRepository.findPatientsByNameContaining("Patient")).thenReturn(List.of(patient));

        List<PatientDTO> result = patientService.searchPatients("Patient");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Patient Name");
    }

    private User createMockPatient() {
        User patient = new User();
        patient.setRole(Role.PATIENT);
        patient.setUsername("patient1");
        patient.setName("Patient Name");
        patient.setEmail("patient@example.com");
        patient.setGender("Female");
        patient.setBloodPressure("120/80");
        patient.setSmokingStatus("Non-Smoker");
        patient.setPhone("1234567890");
        patient.setBirthdate(LocalDate.of(2000, 1, 1));
        patient.setRegistrationDate(LocalDate.of(2023, 1, 1));
        ReflectionTestUtils.setField(patient, "id", UUID.randomUUID());
        return patient;
    }

    private PatientDTO buildPatientDTO() {
        PatientDTO dto = new PatientDTO();
        dto.setName("Patient Name");
        dto.setEmail("patient@example.com");
        dto.setGender("Female");
        dto.setBloodPressure("120/80");
        dto.setSmokingStatus("Non-Smoker");
        dto.setPhone("1234567890");
        dto.setBirthdate(LocalDate.of(2000, 1, 1));
        return dto;
    }
}