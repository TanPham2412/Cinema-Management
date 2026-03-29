package Nhom5.cinema_management.service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * In-memory store for seats currently held (PENDING selection) by users.
 * Keyed by screeningId → Map<seatId, userId>
 */
@Component
public class SeatHoldStore {

    // screeningId → (seatId → userId)
    private final ConcurrentHashMap<Long, ConcurrentHashMap<String, String>> store =
            new ConcurrentHashMap<>();

    public void hold(Long screeningId, String seatId, String userId) {
        store.computeIfAbsent(screeningId, k -> new ConcurrentHashMap<>())
             .put(seatId, userId);
    }

    public void release(Long screeningId, String seatId) {
        ConcurrentHashMap<String, String> seats = store.get(screeningId);
        if (seats != null) seats.remove(seatId);
    }

    public void releaseAll(Long screeningId, String userId) {
        ConcurrentHashMap<String, String> seats = store.get(screeningId);
        if (seats != null) seats.entrySet().removeIf(e -> userId.equals(e.getValue()));
    }

    public Set<String> getHeldSeatIds(Long screeningId) {
        ConcurrentHashMap<String, String> seats = store.get(screeningId);
        return seats == null ? Set.of() : Set.copyOf(seats.keySet());
    }
}
