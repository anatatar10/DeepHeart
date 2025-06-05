package org.example.backend.controller;

import org.example.backend.model.EcgRecord;
import org.example.backend.service.EcgRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ecg")
@CrossOrigin(origins = "*")
public class EcgRecordController {

    @Autowired
    private EcgRecordService ecgRecordService;

    @GetMapping("/user/{userId}")
    public List<EcgRecord> getAllByUser(@PathVariable UUID userId) {
        return ecgRecordService.getAllByUserId(userId);
    }

    @PostMapping
    public EcgRecord addEcg(@RequestBody EcgRecord ecgRecord) {
        return ecgRecordService.save(ecgRecord);
    }

    @DeleteMapping("/{id}")
    public void deleteEcg(@PathVariable UUID id) {
        ecgRecordService.delete(id);
    }

    @GetMapping("/{id}")
    public EcgRecord getById(@PathVariable UUID id) {
        return ecgRecordService.getById(id);
    }
}
