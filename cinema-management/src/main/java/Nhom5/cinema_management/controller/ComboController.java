package Nhom5.cinema_management.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Nhom5.cinema_management.model.Combo;
import Nhom5.cinema_management.repository.ComboRepository;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/combos")
@RequiredArgsConstructor
public class ComboController {

    private final ComboRepository comboRepository;

    @GetMapping
    public ResponseEntity<List<ComboResponse>> getAvailableCombos() {
        List<ComboResponse> combos = comboRepository.findByAvailableTrue()
                .stream()
                .map(ComboResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(combos);
    }

    public record ComboResponse(Long id, String name, String description, Double price, String category) {
        static ComboResponse from(Combo c) {
            return new ComboResponse(c.getId(), c.getName(), c.getDescription(), c.getPrice(), c.getCategory());
        }
    }
}
