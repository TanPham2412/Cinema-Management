package Nhom5.cinema_management.security;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate limiting filter to prevent brute force attacks.
 * - Login/Register: 10 requests per minute per IP
 * - General API:    60 requests per minute per IP
 */
@Component
@Order(1)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int AUTH_LIMIT = 10;
    private static final int GENERAL_LIMIT = 120;
    private static final long WINDOW_MS = 60_000; // 1 minute

    private final Map<String, RateWindow> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, RateWindow> generalBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ip = getClientIp(request);
        String path = request.getRequestURI();

        // Stricter limits for auth endpoints (login, register, forgot-password)
        if (path.contains("/auth/login") || path.contains("/auth/register") ||
            path.contains("/auth/forgot-password") || path.contains("/auth/2fa/verify")) {
            if (!checkRate(authBuckets, ip, AUTH_LIMIT)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"message\":\"Quá nhiều yêu cầu. Vui lòng thử lại sau.\"}");
                return;
            }
        }

        // General rate limit
        if (!checkRate(generalBuckets, ip, GENERAL_LIMIT)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Quá nhiều yêu cầu. Vui lòng thử lại sau.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean checkRate(Map<String, RateWindow> buckets, String key, int limit) {
        long now = System.currentTimeMillis();
        buckets.compute(key, (k, window) -> {
            if (window == null || now - window.startTime > WINDOW_MS) {
                return new RateWindow(now);
            }
            return window;
        });
        RateWindow window = buckets.get(key);
        return window != null && window.counter.incrementAndGet() <= limit;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isEmpty()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }

    private static class RateWindow {
        final long startTime;
        final AtomicInteger counter;

        RateWindow(long startTime) {
            this.startTime = startTime;
            this.counter = new AtomicInteger(0);
        }
    }
}
