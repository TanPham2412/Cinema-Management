package Nhom5.cinema_management.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        createDefaultUser("admin@cinema.com", "Admin@123", "Admin", User.Role.ADMIN);
        createDefaultUser("staff@cinema.com", "Staff@123", "Staff", User.Role.STAFF);
    }

    private void createDefaultUser(String email, String password, String fullName, User.Role role) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .role(role)
                .enabled(true)
                .loyaltyPoints(0)
                .membershipTier(User.MembershipTier.BRONZE)
                .build();
        userRepository.save(user);
        log.info("Created default {} account: {}", role, email);
    }
}
