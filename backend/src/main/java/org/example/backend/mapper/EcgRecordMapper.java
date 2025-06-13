package org.example.backend.mapper;

import org.example.backend.dto.EcgRecordDTO;
import org.example.backend.model.EcgRecord;

public class EcgRecordMapper {

    public static EcgRecordDTO toDTO(EcgRecord entity) {
        EcgRecordDTO dto = new EcgRecordDTO();
        dto.setId(entity.getId());
        dto.setPatientId(entity.getUser().getId());
        dto.setFileName(entity.getFilename());
        dto.setStatus(entity.getStatus());
        dto.setUploadTimestamp(entity.getDateAdded());
        dto.setNormProbability(entity.getNormProbability());
        dto.setMiProbability(entity.getMiProbability());
        dto.setSttcProbability(entity.getSttcProbability());
        dto.setCdProbability(entity.getCdProbability());
        dto.setHypProbability(entity.getHypProbability());
        return dto;
    }
}