package com.smartcampus.booking.dto;

import java.util.List;

// Everything an admin sees on "All bookings" (FR-A6). Two lists, because a registration has no
// facility and no times of its own.
public record AdminBookingsResponse(
        List<BookingResponse> bookings,
        List<RegistrationResponse> registrations) {}
