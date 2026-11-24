package com.smartcampus.booking.dto;

import com.smartcampus.booking.entity.Registration;
import com.smartcampus.booking.entity.RegistrationStatus;
import java.time.OffsetDateTime;

public record RegistrationResponse(
        Integer id,
        Integer userId,
        Integer eventId,
        RegistrationStatus status,
        OffsetDateTime createdAt) {

    // Entity -> DTO in one place, so every endpoint returns the same shape
    public static RegistrationResponse from(Registration registration) {
        return new RegistrationResponse(
                registration.getId(),
                registration.getUserId(),
                registration.getEventId(),
                registration.getStatus(),
                registration.getCreatedAt());
    }
}
