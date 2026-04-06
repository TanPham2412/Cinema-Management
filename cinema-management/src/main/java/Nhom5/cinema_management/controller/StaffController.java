package Nhom5.cinema_management.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Nhom5.cinema_management.repository.BookingRepository;
import Nhom5.cinema_management.repository.ScreeningRepository;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/staff")
@RequiredArgsConstructor

public class StaffController {

    private final BookingRepository bookingRepository;
    private final ScreeningRepository screeningRepository;

    @GetMapping("/stats/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Map<String, Object>> getTodayStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        long sold = bookingRepository.countTodaySold(startOfDay, endOfDay);
        long checkedIn = bookingRepository.countTodayCheckedIn(startOfDay, endOfDay);
        double revenue = bookingRepository.sumTodayRevenue(startOfDay, endOfDay);
        long upcoming = screeningRepository.countUpcomingToday(now, endOfDay);

        return ResponseEntity.ok(Map.of(
            "sold", sold,
            "checkedIn", checkedIn,
            "revenue", revenue,
            "upcoming", upcoming
        ));
    }
}
