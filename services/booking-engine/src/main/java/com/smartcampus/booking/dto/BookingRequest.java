package com.smartcampus.booking.dto;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

// Body of POST /api/bookings (FR-U5). No userId: it always comes from the X-User-Id header,
// so nobody can book in someone else's name. Times are ISO-8601 with an offset, e.g. 2026-12-01T10:00:00+02:00.
public record BookingRequest(
        @NotNull Integer facilityId,
        @NotNull OffsetDateTime startTime,
        @NotNull OffsetDateTime endTime) {}
