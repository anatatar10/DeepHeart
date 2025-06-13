package org.example.backend.service;

import org.assertj.core.api.Assertions;
import org.example.backend.model.EcgRecord;
import org.example.backend.repository.EcgRecordRepository;
import org.example.backend.service.EcgRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

public class EcgRecordServiceTest {

    private EcgRecordRepository ecgRecordRepository;
    private EcgRecordService ecgRecordService;

    @BeforeEach
    public void setup() {
        ecgRecordRepository = Mockito.mock(EcgRecordRepository.class);
        ecgRecordService = new EcgRecordService();
        ReflectionTestUtils.setField(ecgRecordService, "ecgRecordRepository", ecgRecordRepository);
    }

    @Test
    public void testGetAllRecords() {
        EcgRecord record = new EcgRecord();
        ReflectionTestUtils.setField(record, "id", UUID.randomUUID());

        Mockito.when(ecgRecordRepository.findAll()).thenReturn(List.of(record));

        List<EcgRecord> records = ecgRecordService.getAllRecords();

        Assertions.assertThat(records).hasSize(1);
        Assertions.assertThat(records.get(0)).isEqualTo(record);
    }

    @Test
    public void testGetById() {
        UUID recordId = UUID.randomUUID();
        EcgRecord record = new EcgRecord();
        ReflectionTestUtils.setField(record, "id", recordId);

        Mockito.when(ecgRecordRepository.findById(recordId)).thenReturn(Optional.of(record));

        EcgRecord found = ecgRecordService.getById(recordId);

        Assertions.assertThat(found).isNotNull();
        Assertions.assertThat(found.getId()).isEqualTo(recordId);
    }

    @Test
    public void testGetAllByUserId() {
        UUID userId = UUID.randomUUID();
        EcgRecord record = new EcgRecord();
        ReflectionTestUtils.setField(record, "id", UUID.randomUUID());

        Mockito.when(ecgRecordRepository.findByUserId(userId)).thenReturn(List.of(record));

        List<EcgRecord> records = ecgRecordService.getAllByUserId(userId);

        Assertions.assertThat(records).hasSize(1);
        Assertions.assertThat(records.get(0)).isEqualTo(record);
    }

    @Test
    public void testSave() {
        EcgRecord record = new EcgRecord();
        ReflectionTestUtils.setField(record, "id", UUID.randomUUID());

        Mockito.when(ecgRecordRepository.save(record)).thenReturn(record);

        EcgRecord saved = ecgRecordService.save(record);

        Assertions.assertThat(saved).isEqualTo(record);
    }

    @Test
    public void testDelete() {
        UUID recordId = UUID.randomUUID();

        ecgRecordService.delete(recordId);

        Mockito.verify(ecgRecordRepository, Mockito.times(1)).deleteById(recordId);
    }
}