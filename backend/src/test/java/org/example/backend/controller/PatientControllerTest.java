
package org.example.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.example.backend.controller.PatientController;
import org.example.backend.dto.PatientDTO;
import org.example.backend.service.PatientService;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PatientController.class)
@AutoConfigureMockMvc(addFilters = false)  // disable security filters for tests
public class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PatientService patientService;

    private ObjectMapper objectMapper;
    private PatientDTO testPatient;

    @BeforeEach
    void setup() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());  // Handle LocalDate

        testPatient = new PatientDTO();
        testPatient.setId(UUID.randomUUID());
        testPatient.setName("John Doe");
        testPatient.setEmail("john@example.com");
        testPatient.setPhone("1234567890");
        testPatient.setGender("Male");
        testPatient.setBirthdate(LocalDate.of(1990, 1, 1));
        testPatient.setBloodPressure("120/80");
        testPatient.setSmokingStatus("Non-Smoker");
    }

    @Test
    void testGetAllPatients() throws Exception {
        Mockito.when(patientService.getAllPatients()).thenReturn(Collections.singletonList(testPatient));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/patients"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].name").value("John Doe"));
    }

    @Test
    void testGetPatientById_found() throws Exception {
        Mockito.when(patientService.getPatientById(ArgumentMatchers.eq(testPatient.getId())))
                .thenReturn(Optional.of(testPatient));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/patients/{id}", testPatient.getId()))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.name").value("John Doe"));
    }

    @Test
    void testGetPatientById_notFound() throws Exception {
        Mockito.when(patientService.getPatientById(ArgumentMatchers.any())).thenReturn(Optional.empty());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/patients/{id}", UUID.randomUUID()))
                .andExpect(MockMvcResultMatchers.status().isNotFound());
    }

    @Test
    void testCreatePatient() throws Exception {
        Mockito.when(patientService.createPatient(ArgumentMatchers.any())).thenReturn(testPatient);

        String json = objectMapper.writeValueAsString(testPatient);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.name").value("John Doe"));
    }

    @Test
    void testUpdatePatient() throws Exception {
        Mockito.when(patientService.updatePatient(ArgumentMatchers.eq(testPatient.getId()), ArgumentMatchers.any())).thenReturn(testPatient);

        String json = objectMapper.writeValueAsString(testPatient);

        mockMvc.perform(MockMvcRequestBuilders.put("/api/patients/{id}", testPatient.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.name").value("John Doe"));
    }

    @Test
    void testDeletePatient() throws Exception {
        Mockito.when(patientService.deletePatient(ArgumentMatchers.eq(testPatient.getId()))).thenReturn(true);

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/patients/{id}", testPatient.getId()))
                .andExpect(MockMvcResultMatchers.status().isNoContent());
    }

    @Test
    void testSearchPatients() throws Exception {
        Mockito.when(patientService.searchPatients(ArgumentMatchers.eq("John")))
                .thenReturn(Collections.singletonList(testPatient));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/patients/search?name=John"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].name").value("John Doe"));
    }
}