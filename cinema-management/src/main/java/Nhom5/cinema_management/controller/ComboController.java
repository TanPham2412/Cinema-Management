package Nhom5.cinema_management.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Nhom5.cinema_management.dto.ComboDTO;
import Nhom5.cinema_management.model.Combo;
import Nhom5.cinema_management.repository.ComboRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/combos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ComboController {

    private final ComboRepository comboRepository;

    // Public: only available combos (for booking page)
    @GetMapping
    public ResponseEntity<List<ComboDTO>> getAvailableCombos() {
        List<ComboDTO> combos = comboRepository.findByAvailableTrue()
                .stream()
                .map(ComboDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(combos);
    }

    // Admin: all combos (including unavailable)
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ComboDTO>> getAllCombos() {
        List<ComboDTO> combos = comboRepository.findAll()
                .stream()
                .map(ComboDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(combos);
    }

    // Admin: create combo
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComboDTO> createCombo(@RequestBody ComboDTO dto) {
        Combo combo = Combo.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .imageUrl(dto.getImageUrl())
                .available(dto.getAvailable() != null ? dto.getAvailable() : true)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(ComboDTO.fromEntity(comboRepository.save(combo)));
    }

    // Admin: update combo
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComboDTO> updateCombo(@PathVariable Long id, @RequestBody ComboDTO dto) {
        Combo combo = comboRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Combo not found: " + id));
        combo.setName(dto.getName());
        combo.setDescription(dto.getDescription());
        combo.setPrice(dto.getPrice());
        combo.setImageUrl(dto.getImageUrl());
        if (dto.getAvailable() != null) combo.setAvailable(dto.getAvailable());
        return ResponseEntity.ok(ComboDTO.fromEntity(comboRepository.save(combo)));
    }

    // Admin: delete combo
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCombo(@PathVariable Long id) {
        if (!comboRepository.existsById(id)) {
            throw new EntityNotFoundException("Combo not found: " + id);
        }
        comboRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
