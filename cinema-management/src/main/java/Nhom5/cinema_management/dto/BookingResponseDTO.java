package Nhom5.cinema_management.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import Nhom5.cinema_management.model.Booking;
import lombok.Data;

@Data
public class BookingResponseDTO {
    private Long id;
    private String bookingCode;
    private Long userId;
    private String userName;
    private Long screeningId;
    private String movieTitle;
    private String cinemaName;
    private String screenName;
    private String date;
    private String time;
    private Double totalAmount;
    private String status;
    private Integer pointsEarned;
    private Integer pointsUsed;
    private LocalDateTime bookingTime;
    private List<SeatInfo> seats;

    @Data
    public static class SeatInfo {
        private Long seatId;
        private String seatRow;
        private Integer seatNumber;
        private String seatType;
        private Double price;
    }

    public static BookingResponseDTO fromEntity(Booking b) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId(b.getId());
        dto.setBookingCode(b.getBookingCode());
        dto.setUserId(b.getUser().getId());
        dto.setUserName(b.getUser().getFullName());
        dto.setScreeningId(b.getScreening().getId());
        dto.setMovieTitle(b.getScreening().getMovie().getTitle());
        dto.setCinemaName(b.getScreening().getScreen().getCinema().getName());
        dto.setScreenName(b.getScreening().getScreen().getName());
        dto.setDate(b.getScreening().getStartTime().toLocalDate().toString());
        dto.setTime(String.format("%02d:%02d",
                b.getScreening().getStartTime().getHour(),
                b.getScreening().getStartTime().getMinute()));
        dto.setTotalAmount(b.getTotalAmount());
        dto.setStatus(b.getStatus().name());
        dto.setPointsEarned(b.getPointsEarned());
        dto.setPointsUsed(b.getPointsUsed());
        dto.setBookingTime(b.getBookingTime());

        if (b.getBookingSeats() != null) {
            dto.setSeats(b.getBookingSeats().stream().map(bs -> {
                SeatInfo si = new SeatInfo();
                si.setSeatId(bs.getSeat().getId());
                si.setSeatRow(bs.getSeat().getSeatRow());
                si.setSeatNumber(bs.getSeat().getSeatNumber());
                si.setSeatType(bs.getSeat().getSeatType().name());
                si.setPrice(bs.getPrice());
                return si;
            }).collect(Collectors.toList()));
        }
        return dto;
    }
}
