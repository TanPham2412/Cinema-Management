package Nhom5.cinema_management.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import Nhom5.cinema_management.model.Booking;
import Nhom5.cinema_management.model.Movie;
import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.BookingRepository;
import Nhom5.cinema_management.repository.CinemaRepository;
import Nhom5.cinema_management.repository.MovieRepository;
import Nhom5.cinema_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final BookingRepository bookingRepository;
    private final MovieRepository movieRepository;
    private final CinemaRepository cinemaRepository;
    private final UserRepository userRepository;

    // ── Dashboard ─────────────────────────────────────────────────────────

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        double totalRevenue = bookingRepository.sumTotalRevenue();
        long ticketsSold = bookingRepository.countConfirmedAndCompleted();
        long nowShowingMovies = movieRepository.countByStatus(Movie.MovieStatus.NOW_SHOWING);
        long activeCinemas = cinemaRepository.count();

        return ResponseEntity.ok(Map.of(
            "totalRevenue", totalRevenue,
            "ticketsSold", ticketsSold,
            "nowShowingMovies", nowShowingMovies,
            "activeCinemas", activeCinemas
        ));
    }

    // ── Users ─────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String keyword) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        User.Role roleEnum = null;
        if (role != null && !role.isEmpty()) {
            try { roleEnum = User.Role.valueOf(role); } catch (Exception ignored) {}
        }
        String kw = (keyword != null && !keyword.isBlank()) ? keyword : null;
        Page<User> result = userRepository.searchUsers(roleEnum, kw, pageable);

        List<Map<String, Object>> content = new ArrayList<>();
        for (User u : result.getContent()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("fullName", u.getFullName());
            m.put("email", u.getEmail());
            m.put("phoneNumber", u.getPhoneNumber());
            m.put("role", u.getRole().name());
            m.put("enabled", u.isEnabled());
            m.put("membershipTier", u.getMembershipTier().name());
            m.put("loyaltyPoints", u.getLoyaltyPoints());
            m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toLocalDate().toString() : null);
            content.add(m);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("number", result.getNumber());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setEnabled(!user.isEnabled());
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("enabled", user.isEnabled()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newRole = body.get("role");
        if (newRole == null) return ResponseEntity.badRequest().build();
        return userRepository.findById(id).map(user -> {
            try {
                user.setRole(User.Role.valueOf(newRole));
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("role", user.getRole().name()));
            } catch (Exception e) {
                return ResponseEntity.badRequest().build();
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Bookings ──────────────────────────────────────────────────────────

    @GetMapping("/bookings")
    public ResponseEntity<Map<String, Object>> getBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long cinemaId,
            @RequestParam(required = false) Long movieId) {

        Pageable pageable = PageRequest.of(page, size);
        Booking.BookingStatus statusEnum = null;
        if (status != null && !status.isEmpty()) {
            try { statusEnum = Booking.BookingStatus.valueOf(status); } catch (Exception ignored) {}
        }
        String kw = (keyword != null && !keyword.isBlank()) ? keyword : null;
        Page<Booking> result = bookingRepository.findForAdmin(statusEnum, cinemaId, movieId, kw, pageable);

        List<Map<String, Object>> content = new ArrayList<>();
        for (Booking b : result.getContent()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", b.getId());
            m.put("bookingCode", b.getBookingCode());
            m.put("customerName", b.getUser().getFullName());
            m.put("customerEmail", b.getUser().getEmail());
            m.put("movieTitle", b.getScreening().getMovie().getTitle());
            m.put("cinemaName", b.getScreening().getScreen().getCinema().getName());
            m.put("screenName", b.getScreening().getScreen().getName());
            m.put("screeningTime", b.getScreening().getStartTime().toString().replace("T", " ").substring(0, 16));
            List<String> seats = new ArrayList<>();
            if (b.getBookingSeats() != null) {
                for (var bs : b.getBookingSeats()) {
                    seats.add(bs.getSeat().getSeatRow() + bs.getSeat().getSeatNumber());
                }
            }
            m.put("seats", seats);
            m.put("totalAmount", b.getTotalAmount());
            m.put("status", b.getStatus().name());
            m.put("createdAt", b.getBookingTime() != null ? b.getBookingTime().toLocalDate().toString() : null);
            content.add(m);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("number", result.getNumber());
        return ResponseEntity.ok(response);
    }

    // ── Revenue ───────────────────────────────────────────────────────────

    @GetMapping("/revenue")
    public ResponseEntity<Map<String, Object>> getRevenue(
            @RequestParam(defaultValue = "month") String period) {

        int year = LocalDate.now().getYear();

        // Monthly stats
        List<Object[]> monthly = bookingRepository.getMonthlyStats(year);
        double[] monthlyRevenue = new double[12];
        long[] monthlyBookings = new long[12];
        for (Object[] row : monthly) {
            int m = ((Number) row[0]).intValue() - 1; // 0-based
            monthlyRevenue[m] = ((Number) row[1]).doubleValue();
            monthlyBookings[m] = ((Number) row[2]).longValue();
        }

        // Total stats
        double totalRevenue = bookingRepository.sumTotalRevenue();
        long totalBookings = bookingRepository.countConfirmedAndCompleted();
        long totalCustomers = bookingRepository.countDistinctCustomers();
        long nowShowingMovies = movieRepository.countByStatus(Movie.MovieStatus.NOW_SHOWING);

        // Top movies (limit 5)
        List<Object[]> topRows = bookingRepository.getTopMoviesByRevenue(PageRequest.of(0, 5));
        List<Map<String, Object>> topMovies = new ArrayList<>();
        for (Object[] row : topRows) {
            Map<String, Object> mv = new LinkedHashMap<>();
            mv.put("title", row[0]);
            mv.put("revenue", ((Number) row[1]).doubleValue());
            mv.put("bookings", ((Number) row[2]).longValue());
            topMovies.add(mv);
        }

        // Revenue by seat type
        List<Object[]> seatTypeRows = bookingRepository.getRevenueBySeatType();
        double totalSeatRevenue = seatTypeRows.stream()
            .mapToDouble(r -> ((Number) r[1]).doubleValue()).sum();
        Map<String, String> seatTypeLabels = Map.of(
            "REGULAR", "Ghế Thường", "VIP", "Ghế VIP", "COUPLE", "Ghế Đôi");
        List<Map<String, Object>> revenueByType = new ArrayList<>();
        for (Object[] row : seatTypeRows) {
            String type = row[0].toString();
            double amount = ((Number) row[1]).doubleValue();
            int pct = totalSeatRevenue > 0 ? (int) Math.round(amount / totalSeatRevenue * 100) : 0;
            Map<String, Object> rt = new LinkedHashMap<>();
            rt.put("type", seatTypeLabels.getOrDefault(type, type));
            rt.put("amount", amount);
            rt.put("pct", pct);
            revenueByType.add(rt);
        }

        // Convert arrays to List for JSON
        List<Double> monthlyRevenueList = new ArrayList<>();
        List<Long> monthlyBookingsList = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            monthlyRevenueList.add(monthlyRevenue[i]);
            monthlyBookingsList.add(monthlyBookings[i]);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalRevenue", totalRevenue);
        response.put("totalBookings", totalBookings);
        response.put("totalCustomers", totalCustomers);
        response.put("totalMovies", nowShowingMovies);
        response.put("revenueGrowth", 0);
        response.put("bookingGrowth", 0);
        response.put("monthlyRevenue", monthlyRevenueList);
        response.put("monthlyBookings", monthlyBookingsList);
        response.put("topMovies", topMovies);
        response.put("revenueByType", revenueByType);
        return ResponseEntity.ok(response);
    }
}

