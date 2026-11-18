package com.smartcampus.auth.dto;

import com.smartcampus.auth.entity.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 20) String universityId,
        @NotBlank @Email @Size(max = 160) String email,
        // BCrypt only uses the first 72 bytes of a password, so anything longer is rejected
        @NotBlank @Size(min = 8, max = 72) String password,
        // Student or Faculty. "Admin" passes here but AuthService rejects it (step 7)
        @NotNull Role role
) {}