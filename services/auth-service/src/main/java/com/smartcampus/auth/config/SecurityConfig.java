package com.smartcampus.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// We only use spring-security-crypto (not the full security starter), so nothing creates a
// PasswordEncoder for us. This @Bean method makes one that Spring can inject into AuthService.
// (C#: services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>())
@Configuration
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        // BCrypt with the default cost (10). Hashes in db/seed.sql store their own cost,
        // so matches() still works for them whatever cost they were made with.
        return new BCryptPasswordEncoder();
    }
}
