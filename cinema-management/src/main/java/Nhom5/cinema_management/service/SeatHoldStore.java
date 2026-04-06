package Nhom5.cinema_management.service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Redis-backed store for seats currently held (SELECT state) by users.
 *
 * Key structure: seat_hold:{screeningId}  →  Redis Hash { seatId: userId }
 * TTL is refreshed on every hold() call (15 minutes, matching booking expiry).
 *
 * Advantages over the previous ConcurrentHashMap approach:
 *   - Survives backend restarts (data persisted in Redis)
 *   - Works correctly across multiple backend instances (horizontal scaling)
 *   - Automatically expires stale holds even if RELEASE event is lost
 */
@Component
public class SeatHoldStore {

    /** TTL for the hold hash — matches the booking expiry window (15 min). */
    private static final Duration HOLD_TTL = Duration.ofMinutes(15);

    private final StringRedisTemplate redis;

    public SeatHoldStore(StringRedisTemplate redis) {
        this.redis = redis;
    }

    // ── Key helper ────────────────────────────────────────────────────────────

    private String key(Long screeningId) {
        return "seat_hold:" + screeningId;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Mark seatId as held by userId for the given screening. */
    public void hold(Long screeningId, String seatId, String userId) {
        String k = key(screeningId);
        redis.opsForHash().put(k, seatId, userId);
        // Refresh TTL on every hold so active sessions don't expire mid-selection
        redis.expire(k, HOLD_TTL);
    }

    /** Release a specific seat hold. */
    public void release(Long screeningId, String seatId) {
        redis.opsForHash().delete(key(screeningId), seatId);
    }

    /** Release all seats held by a specific user for the given screening. */
    public void releaseAll(Long screeningId, String userId) {
        String k = key(screeningId);
        Map<Object, Object> entries = redis.opsForHash().entries(k);
        List<Object> toDelete = entries.entrySet().stream()
                .filter(e -> userId.equals(e.getValue()))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        if (!toDelete.isEmpty()) {
            redis.opsForHash().delete(k, toDelete.toArray());
        }
    }

    /** Return the set of seatIds currently held for the given screening. */
    public Set<String> getHeldSeatIds(Long screeningId) {
        return redis.opsForHash().keys(key(screeningId))
                .stream()
                .map(Object::toString)
                .collect(Collectors.toSet());
    }
}
