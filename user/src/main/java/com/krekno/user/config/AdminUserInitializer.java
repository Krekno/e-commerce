package com.krekno.user.config;

import com.krekno.user.entity.User;
import com.krekno.user.enums.UserRole;
import com.krekno.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "admin@pazar.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .firstName("Super")
                    .lastName("Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("admin123"))
                    .role(UserRole.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("Admin user initialized with email: {} and password: admin123", adminEmail);
        } else {
            log.info("Admin user already exists.");
        }
    }
}
