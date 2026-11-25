package com.smartcampus.booking.controller;

import com.smartcampus.booking.entity.RegistrationStatus;
import com.smartcampus.booking.repository.RegistrationRepository;
import com.smartcampus.booking.service.BookingService;
import com.smartcampus.shared.contracts.TimeSlot;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Service-to-service reads. Everything under /internal is reachable only on this service's own port:
// the gateway has no route for it and denies /internal/** outright, so the browser can never call it.
@RestController
@RequestMapping("/internal")
public class InternalController {

    private final BookingService bookingService;
    private final RegistrationRepository registrationRepository;

    public InternalController(BookingService bookingService, RegistrationRepository registrationRepository) {
        this.bookingService = bookingService;
        this.registrationRepository = registrationRepository;
    }

    // Used by the gateway's GET /api/facilities/{id}/availability (FR-C3).
    // from/to are YYYY-MM-DD Cairo days, both inclusive.
    @GetMapping("/facilities/{facilityId}/booked-slots")
    public List<TimeSlot> bookedSlots(
            @PathVariable Integer facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return bookingService.bookedSlots(facilityId, from, to);
    }

    // Used by facility-catalog to notify registrants when an event changes or is cancelled (FR-A5).
    // A single read with no rules, so it goes straight to the repository.
    @GetMapping("/events/{eventId}/registered-users")
    public List<Integer> registeredUsers(@PathVariable Integer eventId) {
        return registrationRepository.findUserIdsByEventIdAndStatus(eventId, RegistrationStatus.Registered);
    }
}
