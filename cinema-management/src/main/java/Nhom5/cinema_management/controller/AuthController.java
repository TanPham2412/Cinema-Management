package Nhom5.cinema_management.controller;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import Nhom5.cinema_management.dto.AuthResponse;
import Nhom5.cinema_management.dto.LoginRequest;
import Nhom5.cinema_management.dto.RegisterRequest;
import Nhom5.cinema_management.dto.UserDTO;
import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.UserRepository;
import Nhom5.cinema_management.security.JwtService;
import Nhom5.cinema_management.service.AuthService;
import Nhom5.cinema_management.service.TwoFactorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final TwoFactorService twoFactorService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            var result = authService.verifyEmail(token);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/poll-verification")
    public ResponseEntity<?> pollVerification(@RequestParam String pollKey) {
        return ResponseEntity.ok(authService.pollVerification(pollKey));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không được để trống"));
        }
        try {
            authService.resendVerification(email.trim());
            return ResponseEntity.ok(Map.of("message", "Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", "locked", true));
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Đăng nhập thất bại. Vui lòng thử lại.";
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", msg));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("email", user.getEmail());
        result.put("fullName", user.getFullName());
        result.put("phoneNumber", user.getPhoneNumber());
        result.put("role", user.getRole().getId());
        result.put("loyaltyPoints", user.getLoyaltyPoints());
        result.put("membershipTier", user.getMembershipTier().name());
        result.put("enabled", user.isEnabled());
        result.put("twoFactorEnabled", user.getTwoFactorEnabled() != null && user.getTwoFactorEnabled());
        return ResponseEntity.ok(result);
    }

    /** Generate a fresh JWT based on current DB role — used after role change */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String token = jwtService.generateToken(user);
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", Map.of(
            "id", user.getId(),
            "email", user.getEmail(),
            "fullName", user.getFullName(),
            "phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : "",
            "role", user.getRole().getId(),
            "loyaltyPoints", user.getLoyaltyPoints(),
            "membershipTier", user.getMembershipTier().name()
        ));
        return ResponseEntity.ok(result);
    }

    /** Update own profile (fullName, phoneNumber) */
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (body.containsKey("fullName") && body.get("fullName") != null && !body.get("fullName").isBlank()) {
            user.setFullName(body.get("fullName").trim());
        }
        if (body.containsKey("phoneNumber")) {
            user.setPhoneNumber(body.get("phoneNumber"));
        }
        userRepository.save(user);
        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("email", user.getEmail());
        result.put("fullName", user.getFullName());
        result.put("phoneNumber", user.getPhoneNumber());
        result.put("role", user.getRole().getId());
        result.put("loyaltyPoints", user.getLoyaltyPoints());
        result.put("membershipTier", user.getMembershipTier().name());
        return ResponseEntity.ok(result);
    }

    // ── 2FA Endpoints ──────────────────────────────────────────────────────

    /** Step 1: generate secret + QR code URI for setup */
    @PostMapping("/2fa/setup")
    public ResponseEntity<?> setup2FA(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getTwoFactorEnabled() != null && user.getTwoFactorEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("message", "2FA đã được kích hoạt"));
        }
        String secret = twoFactorService.generateSecret();
        user.setTwoFactorSecret(secret);
        userRepository.save(user);
        String qrUri = twoFactorService.getQRCodeUri(user.getEmail(), secret);
        return ResponseEntity.ok(Map.of("secret", secret, "qrUri", qrUri));
    }

    /** Step 2: verify the first TOTP code, then enable 2FA */
    @PostMapping("/2fa/enable")
    public ResponseEntity<?> enable2FA(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String code = body.get("code");
        if (code == null || user.getTwoFactorSecret() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không hợp lệ"));
        }
        if (!twoFactorService.verifyCode(user.getTwoFactorSecret(), code)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Mã xác thực không đúng. Vui lòng thử lại."));
        }
        user.setTwoFactorEnabled(true);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Xác thực 2 lớp đã được kích hoạt"));
    }

    /** Disable 2FA (requires valid TOTP code) */
    @PostMapping("/2fa/disable")
    public ResponseEntity<?> disable2FA(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String code = body.get("code");
        if (code == null || user.getTwoFactorSecret() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không hợp lệ"));
        }
        if (!twoFactorService.verifyCode(user.getTwoFactorSecret(), code)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Mã xác thực không đúng. Vui lòng thử lại."));
        }
        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Xác thực 2 lớp đã được tắt"));
    }

    // ── Password Reset Endpoints ───────────────────────────────────────────

    /** Forgot password — send reset email (public) */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không được để trống"));
        }
        authService.forgotPassword(email.trim());
        // Always return success to avoid user enumeration
        return ResponseEntity.ok(Map.of("message", "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi"));
    }

    /** Reset password with token (public) */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        if (token == null || token.isBlank() || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không hợp lệ"));
        }
        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Mật khẩu đã được đặt lại thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Change password (authenticated) */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (oldPassword == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không hợp lệ"));
        }
        try {
            authService.changePassword(userDetails.getUsername(), oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Mật khẩu đã được thay đổi thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Verify TOTP code during login, return full JWT */
    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verify2FA(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không hợp lệ"));
        }
        User user = userRepository.findByEmail(email)
                .orElse(null);
        if (user == null || user.getTwoFactorSecret() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Tài khoản không hợp lệ"));
        }
        if (!user.isEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", "locked", true));
        }
        if (!twoFactorService.verifyCode(user.getTwoFactorSecret(), code)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Mã xác thực không đúng. Vui lòng thử lại."));
        }
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .user(UserDTO.fromEntity(user))
                .build());
    }
}
