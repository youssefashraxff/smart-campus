package com.smartcampus.auth.dto;
import com.smartcampus.auth.entity.Role;
import com.smartcampus.auth.entity.User;

public record UserResponse(Integer id,
        String name,
        String universityId,
        String email,
        Role role){
            // Entity -> DTO in one place, so every endpoint returns the same shape
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getUniversityId(),
                user.getEmail(),
                user.getRole());
    }
        };