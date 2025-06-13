package org.example.backend.controller;

import org.example.backend.dto.EcgRecordDTO;
import org.example.backend.dto.PatientDTO;
import org.example.backend.service.EcgRecordService;
import org.example.backend.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:4200")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @Autowired
    private EcgRecordService ecgRecordService;

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @GetMapping
    public ResponseEntity<List<PatientDTO>> getAllPatients() {
        List<PatientDTO> patients = patientService.getAllPatients();
        return ResponseEntity.ok(patients);
    }

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PATIENT')")
    @GetMapping("/{id}")
    public ResponseEntity<PatientDTO> getPatientById(@PathVariable UUID id, Authentication authentication) {
        String currentUserEmail = authentication.getName();

        Optional<PatientDTO> patientOpt = patientService.getPatientById(id);
        if (patientOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PatientDTO patient = patientOpt.get();

        if (authentication.getAuthorities().stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_PATIENT"))) {
            if (!patient.getEmail().equalsIgnoreCase(currentUserEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        return ResponseEntity.ok(patient);
    }

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PATIENT')")
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<EcgRecordDTO>> getPatientEcgs(@PathVariable UUID patientId, Authentication authentication) {
        String currentUserEmail = authentication.getName();

        if (authentication.getAuthorities().stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_PATIENT"))) {
            PatientDTO patient = patientService.getPatientByEmail(currentUserEmail);
            if (!patient.getId().equals(patientId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        List<EcgRecordDTO> records = ecgRecordService.getRecordsByPatient(patientId);
        return ResponseEntity.ok(records);
    }

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<PatientDTO>> getPatientsByDoctor(@PathVariable UUID doctorId) {
        List<PatientDTO> patients = patientService.getPatientsByDoctor(doctorId);
        return ResponseEntity.ok(patients);
    }

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<PatientDTO> createPatient(@RequestBody PatientDTO patientDTO) {
        try {
            PatientDTO createdPatient = patientService.createPatient(patientDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPatient);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<PatientDTO> updatePatient(@PathVariable UUID id, @RequestBody PatientDTO patientDTO) {
        PatientDTO updatedPatient = patientService.updatePatient(id, patientDTO);
        return updatedPatient != null ? ResponseEntity.ok(updatedPatient) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable UUID id) {
        boolean deleted = patientService.deletePatient(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @GetMapping("/search")
    public ResponseEntity<List<PatientDTO>> searchPatients(@RequestParam String name) {
        List<PatientDTO> patients = patientService.searchPatients(name);
        return ResponseEntity.ok(patients);
    }
}