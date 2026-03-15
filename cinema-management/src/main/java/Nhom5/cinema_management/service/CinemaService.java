package Nhom5.cinema_management.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import Nhom5.cinema_management.dto.CinemaDTO;
import Nhom5.cinema_management.dto.ScreenDTO;
import Nhom5.cinema_management.model.Cinema;
import Nhom5.cinema_management.model.Screen;
import Nhom5.cinema_management.model.Seat;
import Nhom5.cinema_management.repository.CinemaRepository;
import Nhom5.cinema_management.repository.ScreenRepository;
import Nhom5.cinema_management.repository.SeatRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CinemaService {

    private final CinemaRepository cinemaRepository;
    private final SeatRepository seatRepository;
    private final ScreenRepository screenRepository;

    public List<CinemaDTO> getAllCinemas() {
        return cinemaRepository.findByActiveTrue().stream()
                .map(CinemaDTO::fromEntity).toList();
    }

    public List<CinemaDTO> getAllCinemasAdmin() {
        return cinemaRepository.findAll().stream()
                .map(CinemaDTO::fromEntity).toList();
    }

    public CinemaDTO getCinemaById(Long id) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cinema not found: " + id));
        return CinemaDTO.fromEntity(cinema);
    }

    public List<ScreenDTO> getScreensByCinema(Long cinemaId) {
        Cinema cinema = cinemaRepository.findById(cinemaId)
                .orElseThrow(() -> new EntityNotFoundException("Cinema not found: " + cinemaId));
        return cinema.getScreens().stream()
                .map(ScreenDTO::fromEntity).toList();
    }

    public ScreenDTO getScreenWithSeats(Long screenId) {
        Screen screen = screenRepository.findById(screenId)
                .orElseThrow(() -> new EntityNotFoundException("Screen not found: " + screenId));
        return ScreenDTO.fromEntityWithSeats(screen);
    }

    @Transactional
    public CinemaDTO createCinema(Map<String, Object> body) {
        Cinema cinema = Cinema.builder()
                .name((String) body.get("name"))
                .address((String) body.get("address"))
                .city((String) body.get("city"))
                .phoneNumber((String) body.get("phoneNumber"))
                .description((String) body.get("description"))
                .active(true)
                .screens(new ArrayList<>())
                .build();
        cinema = cinemaRepository.save(cinema);
        return CinemaDTO.fromEntity(cinema);
    }

    @Transactional
    public CinemaDTO updateCinema(Long id, Map<String, Object> body) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cinema not found: " + id));
        if (body.containsKey("name")) cinema.setName((String) body.get("name"));
        if (body.containsKey("address")) cinema.setAddress((String) body.get("address"));
        if (body.containsKey("city")) cinema.setCity((String) body.get("city"));
        if (body.containsKey("phoneNumber")) cinema.setPhoneNumber((String) body.get("phoneNumber"));
        if (body.containsKey("description")) cinema.setDescription((String) body.get("description"));
        if (body.containsKey("active")) cinema.setActive((Boolean) body.get("active"));
        cinema = cinemaRepository.save(cinema);
        return CinemaDTO.fromEntity(cinema);
    }

    @Transactional
    public void deleteCinema(Long id) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cinema not found: " + id));
        cinema.setActive(false);
        cinemaRepository.save(cinema);
    }

    @Transactional
    public ScreenDTO addScreen(Long cinemaId, Map<String, Object> body) {
        Cinema cinema = cinemaRepository.findById(cinemaId)
                .orElseThrow(() -> new EntityNotFoundException("Cinema not found: " + cinemaId));

        int rowCount = ((Number) body.get("rowCount")).intValue();
        int seatsPerRow = ((Number) body.get("seatsPerRow")).intValue();
        int totalSeats = rowCount * seatsPerRow;

        Screen screen = Screen.builder()
                .name((String) body.get("name"))
                .cinema(cinema)
                .rowCount(rowCount)
                .seatsPerRow(seatsPerRow)
                .totalSeats(totalSeats)
                .seats(new ArrayList<>())
                .build();

        // Auto-generate seats
        String seatTypeStr = body.getOrDefault("vipRows", "0").toString();
        int vipRows = Integer.parseInt(seatTypeStr);

        List<Seat> seats = new ArrayList<>();
        for (int r = 0; r < rowCount; r++) {
            String rowLabel = String.valueOf((char) ('A' + r));
            Seat.SeatType type = r < vipRows ? Seat.SeatType.VIP : Seat.SeatType.REGULAR;
            for (int n = 1; n <= seatsPerRow; n++) {
                seats.add(Seat.builder()
                        .screen(screen)
                        .seatRow(rowLabel)
                        .seatNumber(n)
                        .seatType(type)
                        .available(true)
                        .build());
            }
        }
        screen.setSeats(seats);
        cinema.getScreens().add(screen);
        cinemaRepository.save(cinema);

        // Reload to get IDs
        cinema = cinemaRepository.findById(cinemaId).orElseThrow();
        Screen saved = cinema.getScreens().stream()
                .filter(s -> s.getName().equals(screen.getName()))
                .reduce((a, b) -> b).orElse(screen);
        return ScreenDTO.fromEntity(saved);
    }
}
