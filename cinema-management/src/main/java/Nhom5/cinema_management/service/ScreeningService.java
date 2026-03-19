package Nhom5.cinema_management.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import Nhom5.cinema_management.dto.ScreeningDTO;
import Nhom5.cinema_management.model.Booking;
import Nhom5.cinema_management.model.Cinema;
import Nhom5.cinema_management.model.Movie;
import Nhom5.cinema_management.model.Screen;
import Nhom5.cinema_management.model.Screening;
import Nhom5.cinema_management.repository.CinemaRepository;
import Nhom5.cinema_management.repository.MovieRepository;
import Nhom5.cinema_management.repository.ScreenRepository;
import Nhom5.cinema_management.repository.ScreeningRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScreeningService {

    private final ScreeningRepository screeningRepository;
    private final MovieRepository movieRepository;
    private final CinemaRepository cinemaRepository;
    private final ScreenRepository screenRepository;

    public List<ScreeningDTO> getScreeningsByMovie(Long movieId) {
        return screeningRepository.findByMovieIdAndActiveTrue(movieId)
                .stream().map(ScreeningDTO::fromEntity).toList();
    }

    public List<ScreeningDTO> getScreeningsByCinema(Long cinemaId) {
        Cinema cinema = cinemaRepository.findById(cinemaId)
                .orElseThrow(() -> new EntityNotFoundException("Cinema not found"));
        return cinema.getScreens().stream()
                .flatMap(screen -> screen.getScreenings().stream())
                .filter(Screening::getActive)
                .map(ScreeningDTO::fromEntity)
                .toList();
    }

    public List<ScreeningDTO> getScreeningsByMovieAndDate(Long movieId, LocalDate date) {
        return screeningRepository.findByMovieIdAndActiveTrue(movieId).stream()
                .filter(s -> s.getStartTime().toLocalDate().equals(date))
                .map(ScreeningDTO::fromEntity)
                .toList();
    }

    public List<ScreeningDTO> getAllScreenings() {
        return screeningRepository.findAll().stream()
                .map(ScreeningDTO::fromEntity).toList();
    }

    public ScreeningDTO getScreeningById(Long id) {
        Screening s = screeningRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Screening not found: " + id));
        return ScreeningDTO.fromEntity(s);
    }

    @Transactional
    public ScreeningDTO createScreening(Map<String, Object> body) {
        Long movieId = Long.parseLong(body.get("movieId").toString());
        Long screenId = Long.parseLong(body.get("screenId").toString());
        LocalDateTime startTime = LocalDateTime.parse(body.get("startTime").toString());
        Double basePrice = Double.parseDouble(body.get("basePrice").toString());

        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found: " + movieId));

        // Find screen by ID directly
        Screen screen = screenRepository.findById(screenId)
                .orElseThrow(() -> new EntityNotFoundException("Screen not found: " + screenId));

        LocalDateTime endTime = startTime.plusMinutes(movie.getDuration() + 15); // +15 min cleanup

        // Check for conflicts
        List<Screening> conflicts = screeningRepository.findConflictingScreenings(screenId, startTime, endTime);
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException("Phòng chiếu đã có suất chiếu khác trong khung giờ này");
        }

        Screening.PriceCategory priceCategory = Screening.PriceCategory.NORMAL;
        if (body.containsKey("priceCategory")) {
            priceCategory = Screening.PriceCategory.valueOf(body.get("priceCategory").toString());
        }

        Screening screening = Screening.builder()
                .movie(movie)
                .screen(screen)
                .startTime(startTime)
                .endTime(endTime)
                .basePrice(basePrice)
                .priceCategory(priceCategory)
                .availableSeats(screen.getTotalSeats())
                .active(true)
                .build();

        return ScreeningDTO.fromEntity(screeningRepository.save(screening));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getScreeningWithSeats(Long id) {
        Screening s = screeningRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Screening not found: " + id));

        // Separate CONFIRMED seats (sold = red) from PENDING not-expired (held = light blue)
        LocalDateTime now = LocalDateTime.now();

        java.util.Set<Long> confirmedSeatIds = s.getBookings() == null ? java.util.Set.of() :
                s.getBookings().stream()
                        .filter(b -> b.getStatus() == Booking.BookingStatus.CONFIRMED)
                        .flatMap(b -> b.getBookingSeats() == null ? java.util.stream.Stream.empty()
                                : b.getBookingSeats().stream())
                        .map(bs -> bs.getSeat().getId())
                        .collect(java.util.stream.Collectors.toSet());

        java.util.Set<Long> pendingSeatIds = s.getBookings() == null ? java.util.Set.of() :
                s.getBookings().stream()
                        .filter(b -> b.getStatus() == Booking.BookingStatus.PENDING
                                  && (b.getExpiryTime() == null || b.getExpiryTime().isAfter(now)))
                        .flatMap(b -> b.getBookingSeats() == null ? java.util.stream.Stream.empty()
                                : b.getBookingSeats().stream())
                        .map(bs -> bs.getSeat().getId())
                        .collect(java.util.stream.Collectors.toSet());

        // Build seat list
        List<Map<String, Object>> seats = s.getScreen().getSeats() == null ? List.of() :
                s.getScreen().getSeats().stream().map(seat -> {
                    Map<String, Object> seatMap = new java.util.LinkedHashMap<>();
                    seatMap.put("id", seat.getId());
                    seatMap.put("seatRow", seat.getSeatRow());
                    seatMap.put("seatNumber", seat.getSeatNumber());
                    seatMap.put("seatType", seat.getSeatType().name());
                    String seatStatus;
                    if (confirmedSeatIds.contains(seat.getId())) {
                        seatStatus = "BOOKED"; // sold - red
                    } else if (pendingSeatIds.contains(seat.getId())) {
                        seatStatus = "HELD"; // payment in progress - light blue
                    } else {
                        seatStatus = "AVAILABLE";
                    }
                    seatMap.put("status", seatStatus);
                    return seatMap;
                }).toList();

        // Build screening info
        Movie movie = s.getMovie();
        String genreNames = movie.getGenres() == null ? "" :
                movie.getGenres().stream().map(g -> g.getName())
                        .collect(java.util.stream.Collectors.joining(", "));

        Map<String, Object> screeningInfo = new java.util.LinkedHashMap<>();
        screeningInfo.put("id", s.getId());
        screeningInfo.put("movieTitle", movie.getTitle());
        screeningInfo.put("posterUrl", movie.getPosterUrl());
        screeningInfo.put("ageRating", movie.getAgeRating());
        screeningInfo.put("genres", genreNames);
        screeningInfo.put("duration", movie.getDuration());
        screeningInfo.put("cinemaName", s.getScreen().getCinema().getName());
        screeningInfo.put("screenName", s.getScreen().getName());
        screeningInfo.put("startTime", s.getStartTime().toString());
        screeningInfo.put("date", s.getStartTime().toLocalDate().toString());
        screeningInfo.put("time", String.format("%02d:%02d",
                s.getStartTime().getHour(), s.getStartTime().getMinute()));
        screeningInfo.put("basePrice", s.getBasePrice());
        screeningInfo.put("priceCategory", s.getPriceCategory().name());
        screeningInfo.put("availableSeats", s.getAvailableSeats());

        return Map.of("screening", screeningInfo, "seats", seats);
    }

    @Transactional
    public ScreeningDTO updateScreening(Long id, Map<String, Object> body) {
        Screening screening = screeningRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Screening not found: " + id));
        if (body.containsKey("basePrice")) {
            screening.setBasePrice(Double.parseDouble(body.get("basePrice").toString()));
        }
        if (body.containsKey("priceCategory")) {
            screening.setPriceCategory(Screening.PriceCategory.valueOf(body.get("priceCategory").toString()));
        }
        if (body.containsKey("active")) {
            screening.setActive((Boolean) body.get("active"));
        }
        return ScreeningDTO.fromEntity(screeningRepository.save(screening));
    }

    @Transactional
    public void deleteScreening(Long id) {
        Screening screening = screeningRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Screening not found: " + id));
        screening.setActive(false);
        screeningRepository.save(screening);
    }
}
