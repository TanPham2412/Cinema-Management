package Nhom5.cinema_management.config;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import Nhom5.cinema_management.model.Combo;
import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.ComboRepository;
import Nhom5.cinema_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ComboRepository comboRepository;

    @Override
    public void run(ApplicationArguments args) {
        createDefaultUser("admin@cinema.com", "Admin@123", "Admin", User.Role.ADMIN);
        createDefaultUser("staff@cinema.com", "Staff@123", "Staff", User.Role.STAFF);
        seedCombos();
    }

    private void seedCombos() {
        if (comboRepository.count() > 0) return;
        List<Combo> combos = List.of(
            Combo.builder().name("Combo Bắp + Nước").description("TIẾT KIỆM 28K!!! Gồm: 1 Bắp (69oz) + 1 Nước có gas (22oz)").price(79000.0).available(true).build(),
            Combo.builder().name("Combo 2 Bắp + 2 Nước").description("TIẾT KIỆM 56K!!! Sở hữu ngay: 2 Bắp (69oz) + 2 Nước có gas (22oz)").price(149000.0).available(true).build(),
            Combo.builder().name("Combo Gia Đình").description("SIÊU TIẾT KIỆM!!! Gồm: 2 Bắp (L) + 2 Nước có gas + 1 Snack").price(219000.0).available(true).build(),
            Combo.builder().name("Combo Đôi Lãng Mạn").description("Dành cho 2 người: 2 Bắp bơ (M) + 2 Nước ép trái cây").price(179000.0).available(true).build(),
            Combo.builder().name("Snack Vặt").description("1 Gói bỏng ngô nhỏ + 1 Kẹo dẻo").price(39000.0).available(true).build()
        );
        comboRepository.saveAll(combos);
        log.info("Seeded {} combos", combos.size());
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
