package com.smartcampus.booking.service;

import com.smartcampus.booking.dto.AdminBookingsResponse;
import com.smartcampus.booking.dto.BookingResponse;
import com.smartcampus.booking.dto.RegistrationResponse;
import com.smartcampus.booking.entity.Booking;
import com.smartcampus.booking.entity.Registration;
import com.smartcampus.booking.repository.BookingRepository;
import com.smartcampus.booking.repository.BookingSpecifications;
import com.smartcampus.booking.repository.RegistrationRepository;
import com.smartcampus.booking.repository.RegistrationSpecifications;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

// Every user's bookings and registrations, for admins (FR-A6)
@Service
public class AdminBookingsService {

    // The id breaks ties, so rows with the same time always come back in the same order
    private static final Sort BY_START = Sort.by("startTime", "id");
    private static final Sort BY_CREATED = Sort.by("createdAt", "id");

    private final BookingRepository bookingRepository;
    private final RegistrationRepository registrationRepository;

    public AdminBookingsService(BookingRepository bookingRepository,
                                RegistrationRepository registrationRepository) {
        this.bookingRepository = bookingRepository;
        this.registrationRepository = registrationRepository;
    }

    // Any filter may be null, which means "don't filter by this". Each filter belongs to one list:
    //   facilityId, date -> bookings
    //   eventId          -> registrations
    // date does not filter registrations: they have no time of their own (the event has it, and events
    // belong to facility-catalog). Cancelled rows are included; their status shows it.
    public AdminBookingsResponse list(Integer facilityId, Integer eventId, LocalDate date) {
        return new AdminBookingsResponse(findBookings(facilityId, date), findRegistrations(eventId));
    }

    private List<BookingResponse> findBookings(Integer facilityId, LocalDate date) {
        // unrestricted() adds no WHERE at all; every filter that was sent adds one condition to it
        Specification<Booking> spec = Specification.unrestricted();
        if (facilityId != null) {
            spec = spec.and(BookingSpecifications.hasFacility(facilityId));
        }
        if (date != null) {
            // The end of a day is the start of the next one. Not "start + 24 hours": the days Egypt
            // changes its clocks last 23 or 25 hours.
            spec = spec.and(BookingSpecifications.onDay(
                    CampusTime.startOfDay(date), CampusTime.startOfDay(date.plusDays(1))));
        }
        return bookingRepository.findAll(spec, BY_START).stream().map(BookingResponse::from).toList();
    }

    private List<RegistrationResponse> findRegistrations(Integer eventId) {
        Specification<Registration> spec = Specification.unrestricted();
        if (eventId != null) {
            spec = spec.and(RegistrationSpecifications.hasEvent(eventId));
        }
        return registrationRepository.findAll(spec, BY_CREATED).stream().map(RegistrationResponse::from).toList();
    }
}
