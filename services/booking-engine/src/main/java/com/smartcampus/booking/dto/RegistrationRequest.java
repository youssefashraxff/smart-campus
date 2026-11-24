package com.smartcampus.booking.dto;

import jakarta.validation.constraints.NotNull;

// No userId here: it always comes from the X-User-Id header, so nobody can register someone else
public record RegistrationRequest(@NotNull Integer eventId) {}
