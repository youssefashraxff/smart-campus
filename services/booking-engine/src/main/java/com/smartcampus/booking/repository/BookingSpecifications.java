package com.smartcampus.booking.repository;

import com.smartcampus.booking.entity.Booking;
import com.smartcampus.booking.entity.BookingStatus;
import java.time.OffsetDateTime;
import org.springframework.data.jpa.domain.Specification;

// A Specification is one WHERE condition as an object. The service joins the ones it needs with and(),
// so optional filters don't need one repository method per combination.
// "booking" is the row being tested (names are the entity's fields) and "cb" builds the condition.
public final class BookingSpecifications {

    private BookingSpecifications() {
    }

    // facility_id = :facilityId
    public static Specification<Booking> hasFacility(Integer facilityId) {
        return (booking, query, cb) -> cb.equal(booking.get("facilityId"), facilityId);
    }

    // start_time < :dayEnd AND end_time > :dayStart
    // Overlap, not "starts on that day": a booking that runs past midnight belongs to both days, and one
    // that ends exactly at midnight does not belong to the next day (same touching-edges rule as SRS 4.3).
    public static Specification<Booking> onDay(OffsetDateTime dayStart, OffsetDateTime dayEnd) {
        return (booking, query, cb) -> cb.and(
                cb.lessThan(booking.get("startTime"), dayEnd),
                cb.greaterThan(booking.get("endTime"), dayStart));
    }

    // status = :status
    public static Specification<Booking> hasStatus(BookingStatus status) {
        return (booking, query, cb) -> cb.equal(booking.get("status"), status);
    }

    // start_time < :end AND end_time > :start  -> the booking shares at least one moment with [start, end).
    // The overlap rule of SRS 4.3: 10:00-11:00 and 11:00-12:00 only touch, so they do NOT overlap.
    // Used for the FR-U5 conflict check and the FR-C3 booked slots.
    public static Specification<Booking> overlaps(OffsetDateTime start, OffsetDateTime end) {
        return (booking, query, cb) -> cb.and(
                cb.lessThan(booking.get("startTime"), end),
                cb.greaterThan(booking.get("endTime"), start));
    }
}
