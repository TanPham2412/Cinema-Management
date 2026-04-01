package Nhom5.cinema_management.service;

import java.util.Map;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import Nhom5.cinema_management.dto.AuthResponse;
import Nhom5.cinema_management.dto.LoginRequest;
import Nhom5.cinema_management.dto.RegisterRequest;
import Nhom5.cinema_management.dto.UserDTO;
import Nhom5.cinema_management.exception.EmailAlreadyExistsException;
import Nhom5.cinema_management.model.User;
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

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .loyaltyPoints(0)
                .membershipTier(User.MembershipTier.BRONZE)
                .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .user(UserDTO.fromEntity(user))
                .build();
    }

    public Object login(LoginRequest request) {
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
