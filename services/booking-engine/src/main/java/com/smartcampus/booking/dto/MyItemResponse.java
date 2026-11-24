package com.smartcampus.booking.dto;

import com.smartcampus.booking.entity.Booking;
import com.smartcampus.booking.entity.Registration;
import com.smartcampus.shared.contracts.EventResponse;
import com.smartcampus.shared.contracts.FacilityResponse;
import java.time.OffsetDateTime;

// One booking or registration, with its details from facility-catalog.
// Keep this shape stable: the dashboard (FR-C3) and the .ics export (FR-U11) reuse it.
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

    // A booking has its own times; the facility gives it a name and a place
    public static MyItemResponse from(Booking booking, FacilityResponse facility) {
        return new MyItemResponse(Kind.BOOKING, booking.getId(),
                facility.title(), facility.building(), facility.location(),
                booking.getStartTime(), booking.getEndTime(), booking.getStatus().name());
    }

    // A facility the catalog no longer has: the booking still has its times, so it can still be listed
    public static MyItemResponse withoutFacility(Booking booking) {
        return new MyItemResponse(Kind.BOOKING, booking.getId(),
                "Facility #" + booking.getFacilityId() + " (no longer listed)", "", "",
                booking.getStartTime(), booking.getEndTime(), booking.getStatus().name());
    }

    // A registration has no times of its own: it starts and ends with its event
    public static MyItemResponse from(Registration registration, EventResponse event) {
        return new MyItemResponse(Kind.REGISTRATION, registration.getId(),
                event.title(), event.building(), event.location(),
                event.startTime(), event.endTime(), registration.getStatus().name());
    }
}
