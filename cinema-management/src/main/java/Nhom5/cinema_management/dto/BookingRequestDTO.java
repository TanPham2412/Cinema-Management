package Nhom5.cinema_management.dto;

import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BookingRequestDTO {
    @NotNull(message = "Phải chọn suất chiếu")
    private Long screeningId;

    @NotNull(message = "Phải chọn ít nhất 1 ghế")
    @Size(min = 1, max = 10, message = "Chọn từ 1-10 ghế")
    private List<Long> seatIds;

    @Size(max = 20, message = "Tối đa 20 combo")
    private List<ComboOrderItem> combos;

    private String paymentMethod;

    @Min(value = 0, message = "Điểm sử dụng không hợp lệ")
    private Integer pointsUsed;

    @Data
    public static class ComboOrderItem {
        @NotNull
        private Long id;
        @Min(value = 1, message = "Số lượng tối thiểu là 1")
        private Integer quantity;
    }
}
