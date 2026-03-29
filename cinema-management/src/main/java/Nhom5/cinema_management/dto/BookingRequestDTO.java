package Nhom5.cinema_management.dto;

import java.util.List;

import lombok.Data;

@Data
public class BookingRequestDTO {
    private Long screeningId;
    private List<Long> seatIds;
    private List<ComboOrderItem> combos;
    private String paymentMethod;
    private Integer pointsUsed;

    @Data
    public static class ComboOrderItem {
        private Long id;
        private Integer quantity;
    }
}
