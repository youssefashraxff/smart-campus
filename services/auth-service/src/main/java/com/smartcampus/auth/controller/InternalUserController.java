package com.smartcampus.auth.controller;

import com.smartcampus.auth.dto.UserResponse;
import com.smartcampus.auth.service.AuthService;
import com.smartcampus.shared.contracts.UserContact;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Service-to-service reads. /internal/** is not routed by the gateway (and the gateway denies it),
// so only the other services can call this, on port 5001.
@RestController
@RequestMapping("/internal/users")
public class InternalUserController {

    private final AuthService authService;

    public InternalUserController(AuthService authService) {
        this.authService = authService;
    }

    // notification-service asks where to email a user (FR-U9). Only name and email: the caller has no
    // use for the rest, and never gets a password hash. 404 for an unknown id.
    @GetMapping("/{id}")
    public UserContact contact(@PathVariable Integer id) {
        UserResponse user = authService.me(id);
        return new UserContact(user.id(), user.name(), user.email());
    }
}
