package Nhom5.cinema_management.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import Nhom5.cinema_management.dto.SeatSelectionMessage;
import Nhom5.cinema_management.service.SeatHoldStore;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class SeatSelectionController {

    private final SimpMessagingTemplate messagingTemplate;
    private final SeatHoldStore seatHoldStore;

    /**
     * Receives seat SELECT/RELEASE events from any client,
     * updates the in-memory hold store, then broadcasts to all subscribers.
     */
    @MessageMapping("/seat-selection")
    public void handleSeatSelection(SeatSelectionMessage message) {
        Long screeningId = message.getScreeningId();
        String seatId = String.valueOf(message.getSeatId());
        String userId = message.getUserId();

        if ("SELECT".equals(message.getAction())) {
            seatHoldStore.hold(screeningId, seatId, userId);
        } else {
            // RELEASE or CONFIRM both remove from the hold store
            seatHoldStore.release(screeningId, seatId);
        }

        messagingTemplate.convertAndSend(
            "/topic/seats/" + screeningId,
            message
        );
    }
}
