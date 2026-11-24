package com.smartcampus.booking.repository;

import com.smartcampus.booking.entity.Booking;
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
}
