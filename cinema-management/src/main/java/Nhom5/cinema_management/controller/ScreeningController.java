package Nhom5.cinema_management.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import Nhom5.cinema_management.dto.ScreeningDTO;
import Nhom5.cinema_management.service.ScreeningService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/screenings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ScreeningController {

    private final ScreeningService screeningService;

    // Public endpoints
    @GetMapping
    public ResponseEntity<List<ScreeningDTO>> getAllScreenings() {
        return ResponseEntity.ok(screeningService.getAllScreenings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScreeningDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(screeningService.getScreeningById(id));
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<Map<String, Object>> getSeats(@PathVariable Long id) {
        return ResponseEntity.ok(screeningService.getScreeningWithSeats(id));
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
