package Nhom5.cinema_management.dto;

import java.util.List;

import Nhom5.cinema_management.model.Screen;
import Nhom5.cinema_management.model.Seat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreenDTO {
    private Long id;
    private String name;
    private Long cinemaId;
    private String cinemaName;
    private Integer totalSeats;
    private Integer rowCount;
    private Integer seatsPerRow;
    private Boolean active;
    private List<SeatDTO> seats;

    public static ScreenDTO fromEntity(Screen screen) {
        return ScreenDTO.builder()
                .id(screen.getId())
                .name(screen.getName())
                .cinemaId(screen.getCinema().getId())
                .cinemaName(screen.getCinema().getName())
                .totalSeats(screen.getTotalSeats())
                .rowCount(screen.getRowCount())
                .seatsPerRow(screen.getSeatsPerRow())
                .active(screen.getActive() != null ? screen.getActive() : true)
                .build();
    }

    public static ScreenDTO fromEntityWithSeats(Screen screen) {
        ScreenDTO dto = fromEntity(screen);
        if (screen.getSeats() != null) {
            dto.setSeats(screen.getSeats().stream().map(SeatDTO::fromEntity).toList());
        }
        return dto;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeatDTO {
        private Long id;
        private String seatRow;
        private Integer seatNumber;
        private Seat.SeatType seatType;
        private Boolean available;

        public static SeatDTO fromEntity(Seat seat) {
            return SeatDTO.builder()
                    .id(seat.getId())
                    .seatRow(seat.getSeatRow())
                    .seatNumber(seat.getSeatNumber())
                    .seatType(seat.getSeatType())
                    .available(seat.getAvailable())
                    .build();
        }
    }
}
