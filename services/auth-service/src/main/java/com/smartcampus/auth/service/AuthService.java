package com.smartcampus.auth.service;

import com.smartcampus.auth.dto.AuthResponse;
import com.smartcampus.auth.dto.LoginRequest;
import com.smartcampus.auth.dto.RegisterRequest;
import com.smartcampus.auth.dto.UserResponse;
import com.smartcampus.auth.entity.Role;
import com.smartcampus.auth.entity.User;
import com.smartcampus.auth.repository.UserRepository;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.ConflictException;
import com.smartcampus.shared.exception.NotFoundException;
import com.smartcampus.shared.exception.UnauthorizedException;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Register and login rules. The only place in the system that ever sees a plain password.
@Service
public class AuthService {

    // One message for "no such email" AND "wrong password", so nobody can probe which emails exist
    private static final String BAD_CREDENTIALS = "Invalid email or password";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // Constructor injection: Spring passes in the beans it created (C#: DI in the constructor)
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        // Public endpoint: allowing Admin here would let anyone make themselves an admin
        if (request.role() == Role.Admin) {
            throw new BadRequestException("Admin accounts cannot be created through registration");
        }

        String email = normalizeEmail(request.email());
        String universityId = request.universityId().trim();

        // Friendly 409s for the normal case. The UNIQUE constraints in V1 are the real guard
        // if two requests race past these checks at the same moment (caught below).
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already registered");
        }
        if (userRepository.existsByUniversityId(universityId)) {
            throw new ConflictException("University ID is already registered");
        }

        // Hash first: the plain password never reaches the entity or the database
        String hash = passwordEncoder.encode(request.password());
        User user = new User(request.name().trim(), universityId, email, hash, request.role());

        try {
            // saveAndFlush sends the INSERT now (not at commit), so a UNIQUE violation is thrown
            // here where we can turn it into a 409 instead of leaking the DB message
            return UserResponse.from(userRepository.saveAndFlush(user));
        } catch (DataIntegrityViolationException ex) {
            // Two registrations raced past the exists checks and the UNIQUE constraint stopped the second
            throw new ConflictException("Email or university ID is already registered");
        }
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> new UnauthorizedException(BAD_CREDENTIALS));

        // matches() reads the salt and cost from the stored hash, re-hashes the input, compares.
        // Never compare with equals(): the stored value is a hash, not the password.
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException(BAD_CREDENTIALS);
        }

        return new AuthResponse(jwtService.generate(user), UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public UserResponse me(Integer userId) {
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    // Postgres compares text case-sensitively, so "Ahmed@X.com" and "ahmed@x.com" would be two users
    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}