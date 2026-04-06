package Nhom5.cinema_management.config;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import Nhom5.cinema_management.model.Combo;
import Nhom5.cinema_management.model.Role;
import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.ComboRepository;
import Nhom5.cinema_management.repository.RoleRepository;
import Nhom5.cinema_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final ComboRepository comboRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        seedRoles();
        migrateExistingUsers();
        seedTestUsers();
        seedCombos();
    }

    private void seedRoles() {
        if (roleRepository.count() == 0) {
            roleRepository.saveAll(List.of(
                Role.builder().id(Role.CUSTOMER_ID).name("CUSTOMER").build(),
                Role.builder().id(Role.ADMIN_ID).name("ADMIN").build(),
                Role.builder().id(Role.STAFF_ID).name("STAFF").build()
            ));
            log.info("Seeded roles table (CUSTOMER={}, ADMIN={}, STAFF={})",
                    Role.CUSTOMER_ID, Role.ADMIN_ID, Role.STAFF_ID);
        }
    }

    private void migrateExistingUsers() {
        try {
            // Check if old role column still exists
            boolean hasOldColumn = false;
            try {
                jdbcTemplate.queryForObject("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'role'", Integer.class);
                hasOldColumn = true;
            } catch (Exception ignored) {}

            if (hasOldColumn) {
                // Make old role column nullable
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(255) NULL DEFAULT NULL");
                // Migrate existing users from old role column to new role_id FK
                int c = jdbcTemplate.update("UPDATE users SET role_id = ? WHERE role = 'CUSTOMER' AND role_id IS NULL", Role.CUSTOMER_ID);
                int a = jdbcTemplate.update("UPDATE users SET role_id = ? WHERE role = 'ADMIN' AND role_id IS NULL", Role.ADMIN_ID);
                int s = jdbcTemplate.update("UPDATE users SET role_id = ? WHERE role = 'STAFF' AND role_id IS NULL", Role.STAFF_ID);
                if (c + a + s > 0) {
                    log.info("Migrated {} users to roles table (customers={}, admins={}, staff={})", c + a + s, c, a, s);
                }
                // Drop the redundant old role column
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN role");
                log.info("Dropped redundant 'role' column from users table");
            }
        } catch (Exception e) {
            log.debug("Role migration skipped (fresh DB or already done): {}", e.getMessage());
        }
    }

    private void seedTestUsers() {
        createTestUser("bronzeuser@cinema.com",   "userrankdong1993",   "Bronze User",   User.MembershipTier.BRONZE,   0);
        createTestUser("silveruser@cinema.com",   "userrankbac1993",    "Silver User",   User.MembershipTier.SILVER,   500);
        createTestUser("golduser@cinema.com",     "userrankvang1993",   "Gold User",     User.MembershipTier.GOLD,     2000);
        createTestUser("platinumuser@cinema.com", "userrankbachkim1993","Platinum User", User.MembershipTier.PLATINUM, 5000);
        createTestUser("diamonduser@cinema.com",  "userankkimcuong1993","Diamond User",  User.MembershipTier.DIAMOND,  10000);
    }

    private void createTestUser(String email, String password, String fullName, User.MembershipTier tier, int loyaltyPoints) {
        if (userRepository.existsByEmail(email)) return;
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .role(roleRepository.findById(Role.CUSTOMER_ID).orElseThrow())
                .enabled(true)
                .loyaltyPoints(loyaltyPoints)
                .membershipTier(tier)
                .build();
        userRepository.save(user);
        log.info("Created test user [{}]: {}", tier, email);
    }

    private void seedCombos() {
        if (comboRepository.count() > 0) return;

        List<Combo> items = List.of(
            // ── COMBO ──────────────────────────────────────────────────────────
            Combo.builder().name("Combo 1 người").category("COMBO")
                .description("1 Bắp ngọt Size M + 1 Nước ngọt Size M").price(65000.0).available(true).build(),
            Combo.builder().name("Combo 2 người").category("COMBO")
                .description("1 Bắp ngọt Size L + 2 Nước ngọt Size M").price(90000.0).available(true).build(),

            // ── BẮP ────────────────────────────────────────────────────────────
            Combo.builder().name("Bắp ngọt Size M").category("POPCORN")
                .description("Bắp rang bơ vị ngọt cỡ vừa").price(45000.0).available(true).build(),
            Combo.builder().name("Bắp ngọt Size L").category("POPCORN")
                .description("Bắp rang bơ vị ngọt cỡ lớn").price(55000.0).available(true).build(),
            Combo.builder().name("Bắp mặn Size M").category("POPCORN")
                .description("Bắp rang bơ vị mặn cỡ vừa").price(45000.0).available(true).build(),
            Combo.builder().name("Bắp mặn Size L").category("POPCORN")
                .description("Bắp rang bơ vị mặn cỡ lớn").price(55000.0).available(true).build(),
            Combo.builder().name("Bắp phô mai Size M").category("POPCORN")
                .description("Bắp rang phủ phô mai đặc biệt cỡ vừa").price(55000.0).available(true).build(),
            Combo.builder().name("Bắp phô mai Size L").category("POPCORN")
                .description("Bắp rang phủ phô mai đặc biệt cỡ lớn").price(65000.0).available(true).build(),

            // ── NƯỚC ───────────────────────────────────────────────────────────
            Combo.builder().name("Pepsi Size M").category("DRINK")
                .description("Nước ngọt có ga Pepsi cỡ vừa (400ml)").price(25000.0).available(true).build(),
            Combo.builder().name("Pepsi Size L").category("DRINK")
                .description("Nước ngọt có ga Pepsi cỡ lớn (600ml)").price(35000.0).available(true).build(),
            Combo.builder().name("7Up Size M").category("DRINK")
                .description("Nước chanh có ga 7Up cỡ vừa (400ml)").price(25000.0).available(true).build(),
            Combo.builder().name("7Up Size L").category("DRINK")
                .description("Nước chanh có ga 7Up cỡ lớn (600ml)").price(35000.0).available(true).build(),
            Combo.builder().name("Mirinda Size M").category("DRINK")
                .description("Nước cam có ga Mirinda cỡ vừa (400ml)").price(25000.0).available(true).build(),
            Combo.builder().name("Mirinda Size L").category("DRINK")
                .description("Nước cam có ga Mirinda cỡ lớn (600ml)").price(35000.0).available(true).build(),
            Combo.builder().name("Nước suối").category("DRINK")
                .description("Nước khoáng tinh khiết (500ml)").price(15000.0).available(true).build()
        );

        comboRepository.saveAll(items);
        log.info("✅ Seeded {} food/drink items", items.size());
    }
}

