package org.example.backend.service;

import jakarta.transaction.Transactional;
import org.example.backend.dto.EcgRecordDTO;
import org.example.backend.mapper.EcgRecordMapper;
import org.example.backend.model.EcgRecord;
import org.example.backend.repository.EcgRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EcgRecordService {

    @Autowired
    private EcgRecordRepository ecgRecordRepository;

    public List<EcgRecord> getAllByUserId(UUID userId) {
        return ecgRecordRepository.findByUserId(userId);
    }

    @Transactional
    public EcgRecord save(EcgRecord ecgRecord) {
        return ecgRecordRepository.save(ecgRecord);
    }

    public void delete(UUID id) {
        ecgRecordRepository.deleteById(id);
    }

    public EcgRecord getById(UUID id) {
        return ecgRecordRepository.findById(id).orElse(null);
    }

    public List<EcgRecord> getEcgRecordsForPatient(UUID patientId) {
        return ecgRecordRepository.findByUserId(patientId);
    }

    public List<EcgRecord> getAllRecords() {
        return ecgRecordRepository.findAll();
    }

    public List<EcgRecordDTO> getRecordsByPatient(UUID patientId) {
        return ecgRecordRepository.findByUserId(patientId)
                .stream()
                .map(EcgRecordMapper::toDTO)
                .collect(Collectors.toList());
    }
}
