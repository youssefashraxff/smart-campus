package com.smartcampus.booking.dto;

import com.smartcampus.booking.entity.Booking;
import com.smartcampus.booking.entity.BookingStatus;
import java.time.OffsetDateTime;

public record BookingResponse(
        Integer id,
        Integer userId,
        Integer facilityId,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        BookingStatus status,
        OffsetDateTime createdAt) {

    // Entity -> DTO in one place, so every endpoint returns the same shape
    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getUserId(),
                booking.getFacilityId(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus(),
                booking.getCreatedAt());
    }
}
