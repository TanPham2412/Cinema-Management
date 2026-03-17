package Nhom5.cinema_management.dto;

import java.util.List;

import lombok.Data;

@Data
public class BookingRequestDTO {
    private Long screeningId;
    private List<Long> seatIds;
    private List<Long> combos;
    private String paymentMethod;
    private Integer pointsUsed;
}
