package Nhom5.cinema_management.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Nhom5.cinema_management.model.Combo;
import Nhom5.cinema_management.repository.BookingComboRepository;
import Nhom5.cinema_management.repository.ComboRepository;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/combos")
@RequiredArgsConstructor
public class ComboController {

    private final ComboRepository comboRepository;
    private final BookingComboRepository bookingComboRepository;

    /** Public: only available combos */
    @GetMapping
    public ResponseEntity<List<ComboResponse>> getAvailableCombos() {
        List<ComboResponse> combos = comboRepository.findByAvailableTrue()
                .stream()
                .map(ComboResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(combos);
    }

    // ── Admin CRUD ────────────────────────────────────────────────────────

    /** GET /combos/admin — all combos including unavailable */
    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<ComboResponse>> getAllCombos() {
        return ResponseEntity.ok(comboRepository.findAll().stream()
                .map(ComboResponse::from).collect(Collectors.toList()));
    }

    /** POST /combos/admin — create combo */
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComboResponse> create(@RequestBody Map<String, Object> body) {
        Combo combo = Combo.builder()
                .name(getString(body, "name"))
                .description(getString(body, "description"))
                .price(getDouble(body, "price"))
                .imageUrl(getString(body, "imageUrl"))
                .category(getString(body, "category"))
                .available(body.get("available") == null ? true : Boolean.parseBoolean(body.get("available").toString()))
                .build();
        if (combo.getName() == null || combo.getName().isBlank() || combo.getPrice() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(ComboResponse.from(comboRepository.save(combo)));
    }

    /** PUT /combos/admin/{id} — update combo */
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComboResponse> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Combo combo = comboRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Combo not found: " + id));

        if (body.containsKey("name") && getString(body, "name") != null)
            combo.setName(getString(body, "name"));
        if (body.containsKey("description"))
            combo.setDescription(getString(body, "description"));
        if (body.containsKey("price") && getDouble(body, "price") != null)
            combo.setPrice(getDouble(body, "price"));
        if (body.containsKey("imageUrl"))
            combo.setImageUrl(getString(body, "imageUrl"));
        if (body.containsKey("category"))
            combo.setCategory(getString(body, "category"));
        if (body.containsKey("available"))
            combo.setAvailable(Boolean.parseBoolean(body.get("available").toString()));

        return ResponseEntity.ok(ComboResponse.from(comboRepository.save(combo)));
    }

    /** DELETE /combos/admin/{id} — soft-delete if used in bookings, hard-delete if not */
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        Combo combo = comboRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Combo not found: " + id));

        boolean hasBookings = !bookingComboRepository.findByComboId(id).isEmpty();
        if (hasBookings) {
            // Soft delete — disable so existing booking history is preserved
            combo.setAvailable(false);
            comboRepository.save(combo);
            return ResponseEntity.ok(Map.of("message", "Combo đã bị vô hiệu hóa (có lịch sử đặt hàng)"));
        }
        comboRepository.delete(combo);
        return ResponseEntity.ok(Map.of("message", "Đã xóa combo"));
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private String getString(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : null;
    }

    private Double getDouble(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        try { return Double.parseDouble(v.toString()); } catch (NumberFormatException e) { return null; }
    }

    // ── DTO ───────────────────────────────────────────────────────────────
    public record ComboResponse(Long id, String name, String description, Double price,
                                 String imageUrl, String category, Boolean available) {
        static ComboResponse from(Combo c) {
            return new ComboResponse(c.getId(), c.getName(), c.getDescription(), c.getPrice(),
                    c.getImageUrl(), c.getCategory(), c.getAvailable());
        }
    }
}

