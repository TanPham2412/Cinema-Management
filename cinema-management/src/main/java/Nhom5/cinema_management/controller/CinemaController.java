package Nhom5.cinema_management.controller;

import java.util.List;
import java.util.Map;

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

import Nhom5.cinema_management.dto.CinemaDTO;
import Nhom5.cinema_management.dto.ScreenDTO;
import Nhom5.cinema_management.service.CinemaService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cinemas")
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaService cinemaService;

    // ── Public endpoints ──────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<CinemaDTO>> getAllCinemas() {
        return ResponseEntity.ok(cinemaService.getAllCinemas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CinemaDTO> getCinemaById(@PathVariable Long id) {
        return ResponseEntity.ok(cinemaService.getCinemaById(id));
    }

    @GetMapping("/{id}/screens")
    public ResponseEntity<List<ScreenDTO>> getScreensByCinema(@PathVariable Long id) {
        return ResponseEntity.ok(cinemaService.getScreensByCinema(id));
    }

    @GetMapping("/screens/{screenId}/seats")
    public ResponseEntity<ScreenDTO> getScreenWithSeats(@PathVariable Long screenId) {
        return ResponseEntity.ok(cinemaService.getScreenWithSeats(screenId));
    }

    // ── Admin endpoints ───────────────────────────────────────────────────

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CinemaDTO>> getAllCinemasAdmin() {
        return ResponseEntity.ok(cinemaService.getAllCinemasAdmin());
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CinemaDTO> createCinema(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(cinemaService.createCinema(body));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CinemaDTO> updateCinema(@PathVariable Long id,
                                                   @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(cinemaService.updateCinema(id, body));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCinema(@PathVariable Long id) {
        cinemaService.deleteCinema(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/admin/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CinemaDTO> toggleCinemaActive(@PathVariable Long id) {
        return ResponseEntity.ok(cinemaService.toggleCinemaActive(id));
    }

    @PostMapping("/admin/{cinemaId}/screens")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScreenDTO> addScreen(@PathVariable Long cinemaId,
                                                @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(cinemaService.addScreen(cinemaId, body));
    }

    @PutMapping("/admin/screens/{screenId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScreenDTO> updateScreen(@PathVariable Long screenId,
                                                   @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(cinemaService.updateScreen(screenId, body));
    }

    @PutMapping("/admin/screens/{screenId}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScreenDTO> toggleScreenActive(@PathVariable Long screenId) {
        return ResponseEntity.ok(cinemaService.toggleScreenActive(screenId));
    }
}
