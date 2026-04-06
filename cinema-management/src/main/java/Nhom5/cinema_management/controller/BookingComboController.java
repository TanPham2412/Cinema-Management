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

import Nhom5.cinema_management.model.Booking;
import Nhom5.cinema_management.model.BookingCombo;
import Nhom5.cinema_management.model.Combo;
import Nhom5.cinema_management.repository.BookingComboRepository;
import Nhom5.cinema_management.repository.BookingRepository;
import Nhom5.cinema_management.repository.ComboRepository;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/booking-combos")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class BookingComboController {

    private final BookingComboRepository bookingComboRepository;
    private final BookingRepository bookingRepository;
    private final ComboRepository comboRepository;

    /** GET /booking-combos/booking/{bookingId} — list all combos for a booking */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<BookingComboDTO>> getByBooking(@PathVariable Long bookingId) {
        List<BookingComboDTO> list = bookingComboRepository.findByBookingId(bookingId)
                .stream().map(BookingComboDTO::from).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    /** POST /booking-combos — add a combo to an existing booking */
    @PostMapping
    public ResponseEntity<BookingComboDTO> addCombo(@RequestBody Map<String, Object> body) {
        Long bookingId = getLong(body, "bookingId");
        Long comboId   = getLong(body, "comboId");
        Integer qty    = getInt(body, "quantity");

        if (bookingId == null || comboId == null || qty == null || qty <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Booking not found: " + bookingId));
        Combo combo = comboRepository.findById(comboId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Combo not found: " + comboId));

        BookingCombo bc = BookingCombo.builder()
                .booking(booking)
                .combo(combo)
                .quantity(qty)
                .price(combo.getPrice())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(BookingComboDTO.from(bookingComboRepository.save(bc)));
    }

    /** PUT /booking-combos/{id} — update quantity */
    @PutMapping("/{id}")
    public ResponseEntity<BookingComboDTO> updateQty(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        BookingCombo bc = bookingComboRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("BookingCombo not found: " + id));

        Integer qty = getInt(body, "quantity");
        if (qty == null || qty <= 0) return ResponseEntity.badRequest().build();

        bc.setQuantity(qty);
        return ResponseEntity.ok(BookingComboDTO.from(bookingComboRepository.save(bc)));
    }

    /** DELETE /booking-combos/{id} — remove a combo from a booking */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!bookingComboRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        bookingComboRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private Long getLong(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        try { return Long.parseLong(v.toString()); } catch (NumberFormatException e) { return null; }
    }

    private Integer getInt(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        try { return Integer.parseInt(v.toString()); } catch (NumberFormatException e) { return null; }
    }

    // ── DTO ───────────────────────────────────────────────────────────────
    public record BookingComboDTO(
            Long id,
            Long bookingId,
            Long comboId,
            String comboName,
            String comboCategory,
            Integer quantity,
            Double price) {
        static BookingComboDTO from(BookingCombo bc) {
            return new BookingComboDTO(
                    bc.getId(),
                    bc.getBooking() != null ? bc.getBooking().getId() : null,
                    bc.getCombo() != null ? bc.getCombo().getId() : null,
                    bc.getCombo() != null ? bc.getCombo().getName() : null,
                    bc.getCombo() != null ? bc.getCombo().getCategory() : null,
                    bc.getQuantity(),
                    bc.getPrice());
        }
    }
}
