package Nhom5.cinema_management.dto;

import lombok.Data;

@Data
public class SeatSelectionMessage {
    private Long screeningId;
    private Object seatId;       // Long from real seats, or String from mock
    private String action;       // "SELECT" or "RELEASE"
    private String userId;       // user email
}
