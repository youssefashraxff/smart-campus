package com.smartcampus.shared.contracts;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.OffsetDateTime;

// One booking or registration of the current user, with its details from facility-catalog (FR-U7).
// In shared because three places use the same shape: booking-engine's /api/bookings/mine,
// the .ics export (FR-U11) and the gateway's /api/dashboard (FR-C3).
// booking-engine builds it in MyItemsService (it needs the Booking/Registration entities, which stay there).
@JsonIgnoreProperties(ignoreUnknown = true)
public record MyItemResponse(
        Kind kind,
        Integer id,
        String title,
        String building,
        String location,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        String status) {

    public enum Kind {
        BOOKING,
        REGISTRATION
    }
}
