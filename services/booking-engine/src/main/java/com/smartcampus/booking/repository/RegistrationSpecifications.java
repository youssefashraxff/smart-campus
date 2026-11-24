package com.smartcampus.booking.repository;

import com.smartcampus.booking.entity.Registration;
import org.springframework.data.jpa.domain.Specification;

// Same idea as BookingSpecifications
public final class RegistrationSpecifications {

    private RegistrationSpecifications() {
    }

    // event_id = :eventId
    public static Specification<Registration> hasEvent(Integer eventId) {
        return (registration, query, cb) -> cb.equal(registration.get("eventId"), eventId);
    }
}
