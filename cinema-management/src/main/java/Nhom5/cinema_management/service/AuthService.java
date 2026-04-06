package Nhom5.cinema_management.service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import Nhom5.cinema_management.dto.AuthResponse;
import Nhom5.cinema_management.dto.LoginRequest;
import Nhom5.cinema_management.dto.RegisterRequest;
import Nhom5.cinema_management.dto.UserDTO;
import Nhom5.cinema_management.exception.EmailAlreadyExistsException;
import Nhom5.cinema_management.model.Role;
import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.RoleRepository;
import Nhom5.cinema_management.repository.UserRepository;
import Nhom5.cinema_management.security.JwtService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetService passwordResetService;
    private final RoleRepository roleRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendBaseUrl;

    private static final String EMAIL_VERIFY_PREFIX = "email_verify:";
    private static final String POLL_VERIFY_PREFIX = "poll_verify:";

    public Map<String, String> register(RegisterRequest request) {
        User existing = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (existing != null) {
            // Allow re-registration only if account was never verified
            if (Boolean.TRUE.equals(existing.getEmailVerified()) || existing.isEnabled()) {
                throw new EmailAlreadyExistsException("Email already exists");
            }
            // Unverified account → update info and resend verification
            existing.setPassword(passwordEncoder.encode(request.getPassword()));
            existing.setFullName(request.getFullName());
            existing.setPhoneNumber(request.getPhoneNumber());
            userRepository.save(existing);
            String token = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set(EMAIL_VERIFY_PREFIX + token, existing.getEmail(), 24, TimeUnit.HOURS);
            emailService.sendVerificationEmail(existing.getEmail(), existing.getFullName(), token, frontendBaseUrl);
            String pollKey = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set(POLL_VERIFY_PREFIX + pollKey, existing.getEmail(), 24, TimeUnit.HOURS);
            return Map.of("message", "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.", "pollKey", pollKey);
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(roleRepository.findById(Role.CUSTOMER_ID)
                        .orElseThrow(() -> new RuntimeException("Role CUSTOMER not found")))
                .enabled(false)
                .emailVerified(false)
                .loyaltyPoints(0)
                .membershipTier(User.MembershipTier.BRONZE)
                .build();

        userRepository.save(user);

        // Generate verification token, store in Redis 24h
        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(EMAIL_VERIFY_PREFIX + token, user.getEmail(), 24, TimeUnit.HOURS);

        // Send verification email async
        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), token, frontendBaseUrl);

        // Generate poll key so the browser tab can poll for verification status
        String pollKey = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(POLL_VERIFY_PREFIX + pollKey, user.getEmail(), 24, TimeUnit.HOURS);

        return Map.of("message", "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.", "pollKey", pollKey);
    }

    public AuthResponse verifyEmail(String token) {
        String email = redisTemplate.opsForValue().get(EMAIL_VERIFY_PREFIX + token);
        if (email == null) {
            throw new RuntimeException("Link xác nhận không hợp lệ hoặc đã hết hạn");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại"));
        user.setEnabled(true);
        user.setEmailVerified(true);
        userRepository.save(user);
        redisTemplate.delete(EMAIL_VERIFY_PREFIX + token);
        // Auto-login: generate JWT so frontend can log in immediately
        String jwt = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(jwt)
                .user(UserDTO.fromEntity(user))
                .build();
    }

    public Map<String, Object> pollVerification(String pollKey) {
        String email = redisTemplate.opsForValue().get(POLL_VERIFY_PREFIX + pollKey);
        if (email == null) {
            return Map.of("verified", false);
        }
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getEmailVerified())) {
            return Map.of("verified", false);
        }
        // Verified — return JWT once and delete poll key
        redisTemplate.delete(POLL_VERIFY_PREFIX + pollKey);
        String jwt = jwtService.generateToken(user);
        return Map.of("verified", true, "token", jwt, "user", UserDTO.fromEntity(user));
    }

    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new RuntimeException("Tài khoản đã được xác thực email rồi");
        }
        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(EMAIL_VERIFY_PREFIX + token, email, 24, TimeUnit.HOURS);
        emailService.sendVerificationEmail(email, user.getFullName(), token, frontendBaseUrl);
    }

    public Object login(LoginRequest request) {
        // Pre-check: email not verified → give clear message before Spring Security throws DisabledException
        User preCheck = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (preCheck != null && Boolean.FALSE.equals(preCheck.getEmailVerified())) {
            throw new RuntimeException("Tài khoản chưa được xác nhận email. Vui lòng kiểm tra hộp thư của bạn. Nếu không thấy email, hãy yêu cầu gửi lại.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // If 2FA is enabled, return a challenge instead of a JWT
        if (user.getTwoFactorEnabled() != null && user.getTwoFactorEnabled()) {
            return Map.of(
                "requiresTwoFactor", true,
                "email", user.getEmail()
            );
        }

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .user(UserDTO.fromEntity(user))
                .build();
    }

    public void forgotPassword(String email) {
        passwordResetService.sendResetEmail(email);
    }

    public void resetPassword(String token, String newPassword) {
        passwordResetService.resetPassword(token, newPassword);
    }

    public void changePassword(String email, String oldPassword, String newPassword) {
        passwordResetService.changePassword(email, oldPassword, newPassword);
    }
}
