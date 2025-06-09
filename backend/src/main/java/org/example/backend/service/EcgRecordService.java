package org.example.backend.service;

import org.example.backend.model.EcgRecord;
import org.example.backend.repository.EcgRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class EcgRecordService {

    @Autowired
    private EcgRecordRepository ecgRecordRepository;

    public List<EcgRecord> getAllByUserId(UUID userId) {
        return ecgRecordRepository.findByUserId(userId);
    }

    public EcgRecord save(EcgRecord ecgRecord) {
        return ecgRecordRepository.save(ecgRecord);
    }

    public void delete(UUID id) {
        ecgRecordRepository.deleteById(id);
    }

    public EcgRecord getById(UUID id) {
        return ecgRecordRepository.findById(id).orElse(null);
    }
}
