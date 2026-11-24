package com.smartcampus.booking.controller;

import com.smartcampus.booking.dto.RegistrationRequest;
import com.smartcampus.booking.dto.RegistrationResponse;
import com.smartcampus.booking.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {

    private final RegistrationService service;

    public RegistrationController(RegistrationService service) {
        this.service = service;
    }

    // X-User-Id is set by the gateway from the JWT
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)                          // 201
    public RegistrationResponse register(@RequestHeader("X-User-Id") Integer userId,
                                         @Valid @RequestBody RegistrationRequest request) {
        return service.register(userId, request.eventId());
    }
}
