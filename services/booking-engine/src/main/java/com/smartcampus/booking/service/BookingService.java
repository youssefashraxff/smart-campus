package com.smartcampus.booking.service;

import com.smartcampus.booking.client.CatalogClient;
import com.smartcampus.booking.client.NotificationClient;
import com.smartcampus.booking.dto.BookingRequest;
import com.smartcampus.booking.dto.BookingResponse;
import com.smartcampus.booking.entity.Booking;
import com.smartcampus.shared.contracts.FacilityResponse;
import com.smartcampus.shared.contracts.TimeSlot;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.ConflictException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.stereotype.Service;

// Booking rules. Not @Transactional on purpose: the catalog is called before the transaction and
// notifications are sent after it has committed (same shape as RegistrationService).
@Service
public class BookingService {

    // A week view asks for 7 days, a month view for up to 6 weeks; 31 keeps one request cheap
    private static final int MAX_RANGE_DAYS = 31;

    private final CatalogClient catalogClient;
    private final BookingTransactions transactions;
    private final NotificationClient notificationClient;

    public BookingService(CatalogClient catalogClient, BookingTransactions transactions,
                          NotificationClient notificationClient) {
        this.catalogClient = catalogClient;
        this.transactions = transactions;
        this.notificationClient = notificationClient;
    }

    // FR-U5
    public BookingResponse reserve(Integer userId, BookingRequest request) {
        OffsetDateTime start = request.startTime();
        OffsetDateTime end = request.endTime();

        // 1. Rules that need nothing but the request (400). SRS 4.3 rule 1: end > start.
        if (!end.isAfter(start)) {
            throw new BadRequestException("endTime must be after startTime");
        }
        if (!start.isAfter(OffsetDateTime.now())) {
            throw new BadRequestException("You can only book a time in the future");
        }

        // 2. Before the transaction: does the facility exist and can it be booked? (404 / 503 / 409)
        FacilityResponse facility = catalogClient.getFacility(request.facilityId());
        if ("Maintenance".equals(facility.status())) {
            // FR-A2 / SRS 4.3 rule 4
            throw new ConflictException(facility.title() + " is under maintenance and can't be booked");
        }

        // 3. The transaction: when this returns, it has committed
        Booking saved = saveOrConflict(userId, request.facilityId(), start, end);

        // 4. After the commit. Never throws (NFR-4)
        notificationClient.sendConfirmation(userId, "Your booking of " + facility.title() + " on "
                + CampusTime.format(start) + " to " + CampusTime.formatTime(end) + " is confirmed.");

        return BookingResponse.from(saved);
    }

    // FR-U8. Does not need facility-catalog, so cancelling works even when the catalog is down
    public void cancel(Integer userId, Integer id) {
        Booking cancelled = transactions.cancel(userId, id);
        notificationClient.sendCancellation(userId, "Your booking #" + id + " on "
                + CampusTime.format(cancelled.getStartTime()) + " has been cancelled.");
    }

    // FR-C3 (internal, called by the gateway's availability endpoint). from/to are Cairo days, both
    // inclusive; the result covers [from 00:00, to + 1 day 00:00). Only times, never who booked (privacy).
    public List<TimeSlot> bookedSlots(Integer facilityId, LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw new BadRequestException("to must not be before from");
        }
        if (to.isAfter(from.plusDays(MAX_RANGE_DAYS - 1))) {
            throw new BadRequestException("The range can be at most " + MAX_RANGE_DAYS + " days");
        }
        OffsetDateTime rangeStart = CampusTime.startOfDay(from);
        OffsetDateTime rangeEnd = CampusTime.startOfDay(to.plusDays(1));

        // Each booking is one row, so each slot is listed once even if it spans several days of the range
        return transactions.confirmedOverlapping(facilityId, rangeStart, rangeEnd).stream()
                .map(b -> new TimeSlot(b.getStartTime(), b.getEndTime()))
                .toList();
    }

    // A serialization failure can appear as late as the commit, so it is caught here, outside the
    // transaction (same reason as RegistrationService.saveOrConflict)
    private Booking saveOrConflict(Integer userId, Integer facilityId, OffsetDateTime start, OffsetDateTime end) {
        try {
            return transactions.reserve(userId, facilityId, start, end);
        } catch (ConcurrencyFailureException ex) {
            // SQLSTATE 40001: a simultaneous booking won. Retrying will show whether the slot is still free.
            throw new ConflictException("Another booking happened at the same moment, please try again");
        }
    }
}
