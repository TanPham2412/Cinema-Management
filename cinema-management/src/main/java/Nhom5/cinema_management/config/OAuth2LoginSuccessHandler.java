package Nhom5.cinema_management.config;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.UserRepository;
import Nhom5.cinema_management.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // Lấy thông tin từ Google
        String email = (String) attributes.get("email");
        String fullName = (String) attributes.get("name");
        String googleId = (String) attributes.get("sub");

        // Kiểm tra user đã tồn tại chưa
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    // Tạo user mới nếu chưa tồn tại
                    User newUser = User.builder()
                            .email(email)
                            .fullName(fullName)
                            .password("") // Không có password cho OAuth login
                            .role(User.Role.CUSTOMER)
                            .membershipTier(User.MembershipTier.BRONZE)
                            .loyaltyPoints(0)
                            .enabled(true)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return userRepository.save(newUser);
                });

        // Cập nhật last login
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Check 2FA
        if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            // Redirect to frontend 2FA challenge — no JWT yet
            String targetUrl = UriComponentsBuilder.fromUriString("https://plvcinema.xyz/auth/google/callback")
                    .queryParam("requires2fa", "true")
                    .queryParam("email", email)
                    .build()
                    .toUriString();
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
            return;
        }

        // Tạo JWT token
        String token = jwtService.generateToken(user);

        // Redirect về frontend với token
        String targetUrl = UriComponentsBuilder.fromUriString("https://plvcinema.xyz/auth/google/callback")
                .queryParam("token", token)
                .build()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}