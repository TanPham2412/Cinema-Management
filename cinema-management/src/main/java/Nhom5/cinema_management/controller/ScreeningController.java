package Nhom5.cinema_management.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import Nhom5.cinema_management.dto.ScreeningDTO;
import Nhom5.cinema_management.service.ScreeningService;
import Nhom5.cinema_management.service.SeatHoldStore;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/screenings")
@RequiredArgsConstructor

public class ScreeningController {

    private final ScreeningService screeningService;
    private final SeatHoldStore seatHoldStore;

    // Public endpoints
    @GetMapping
    public ResponseEntity<List<ScreeningDTO>> getAllScreenings() {
        return ResponseEntity.ok(screeningService.getAllScreenings());
    }

    @GetMapping("/today")
    public ResponseEntity<List<ScreeningDTO>> getTodayScreenings() {
        return ResponseEntity.ok(screeningService.getTodayScreenings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScreeningDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(screeningService.getScreeningById(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ScreeningDTO> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(screeningService.getScreeningBySlug(slug));
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<Map<String, Object>> getSeats(@PathVariable Long id) {
        return ResponseEntity.ok(screeningService.getScreeningWithSeats(id));
    }

    @GetMapping("/slug/{slug}/seats")
    public ResponseEntity<Map<String, Object>> getSeatsBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(screeningService.getScreeningWithSeatsBySlug(slug));
    }

    /** Returns seat IDs currently held (in-progress selection) by any user for this screening. */
    @GetMapping("/{id}/held-seats")
    public ResponseEntity<Set<String>> getHeldSeats(@PathVariable Long id) {
        return ResponseEntity.ok(seatHoldStore.getHeldSeatIds(id));
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<ScreeningDTO>> getByMovie(
            @PathVariable Long movieId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date != null) {
            return ResponseEntity.ok(screeningService.getScreeningsByMovieAndDate(movieId, date));
        }
        return ResponseEntity.ok(screeningService.getScreeningsByMovie(movieId));
    }

    @GetMapping("/cinema/{cinemaId}")
    public ResponseEntity<List<ScreeningDTO>> getByCinema(@PathVariable Long cinemaId) {
        return ResponseEntity.ok(screeningService.getScreeningsByCinema(cinemaId));
    }

    // Admin endpoints
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScreeningDTO> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(screeningService.createScreening(body));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScreeningDTO> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(screeningService.updateScreening(id, body));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        screeningService.deleteScreening(id);
        return ResponseEntity.noContent().build();
    }
}
