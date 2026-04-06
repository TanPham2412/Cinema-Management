package Nhom5.cinema_management.service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private static final String REDIS_KEY_PREFIX = "pwd_reset:";
    private static final long TOKEN_TTL_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, String> redisTemplate;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendBaseUrl;

    /**
     * Generates a reset token, stores it in Redis, and emails the user.
     * Always returns silently even if email doesn't exist (no user enumeration).
     */
    public void sendResetEmail(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            String redisKey = REDIS_KEY_PREFIX + token;
            redisTemplate.opsForValue().set(redisKey, email, TOKEN_TTL_MINUTES, TimeUnit.MINUTES);
            emailService.sendPasswordResetEmail(email, user.getFullName(), token, frontendBaseUrl);
            log.info("Password reset token generated for {}", email);
        });
    }

    /**
     * Validates token, updates password, invalidates token.
     */
    public void resetPassword(String token, String newPassword) {
        String redisKey = REDIS_KEY_PREFIX + token;
        String email = redisTemplate.opsForValue().get(redisKey);
        if (email == null) {
            throw new RuntimeException("Token không hợp lệ hoặc đã hết hạn");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        redisTemplate.delete(redisKey);
        log.info("Password reset completed for {}", email);
    }

    /**
     * Changes password after verifying the old password.
     */
    public void changePassword(String email, String oldPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại"));
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu cũ không đúng");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed for {}", email);
    }
}
