package com.smartcampus.booking.service;

import com.smartcampus.booking.entity.Booking;
import com.smartcampus.booking.entity.BookingStatus;
import com.smartcampus.booking.repository.BookingRepository;
import com.smartcampus.booking.repository.BookingSpecifications;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.ConflictException;
import com.smartcampus.shared.exception.NotFoundException;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

// The database part of bookings, in its own bean so that @Transactional works
// (see RegistrationTransactions)
@Service
public class BookingTransactions {

    private final BookingRepository repository;

    public BookingTransactions(BookingRepository repository) {
        this.repository = repository;
    }

    // FR-U5 / SRS 4.3 rules 2 and 3: the overlap check and the insert in ONE serializable transaction.
    //
    // Why SERIALIZABLE: with the default (READ COMMITTED), two requests for the same slot can both run the
    // check, both see "no overlap" (neither has inserted yet), and both insert -> double booking.
    // SERIALIZABLE makes the database guarantee the result is as if the transactions ran one after the
    // other. PostgreSQL notices that the second one read rows the first one changed and aborts it with
    // SQLSTATE 40001; BookingService turns that into a 409.
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Booking reserve(Integer userId, Integer facilityId, OffsetDateTime start, OffsetDateTime end) {
        Specification<Booking> clash = BookingSpecifications.hasFacility(facilityId)
                .and(BookingSpecifications.hasStatus(BookingStatus.Confirmed))
                .and(BookingSpecifications.overlaps(start, end));
        if (repository.exists(clash)) {
            throw new ConflictException("This time slot overlaps an existing booking");
        }
        return repository.save(new Booking(userId, facilityId, start, end));
    }

    @Transactional
    public Booking cancel(Integer userId, Integer id) {
        // Someone else's booking gives the same 404 as a missing one, so nobody can probe which ids exist
        Booking booking = repository.findWithLockById(id)
                .filter(b -> b.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Booking " + id + " not found"));
        if (booking.getStatus() == BookingStatus.Cancelled) {
            throw new ConflictException("This booking is already cancelled");
        }
        if (!booking.getStartTime().isAfter(OffsetDateTime.now())) {
            throw new BadRequestException("Past bookings can't be cancelled");
        }
        booking.cancel();
        return repository.save(booking);
    }

    // FR-C3 availability: Confirmed bookings of a facility that overlap [start, end), earliest first
    @Transactional(readOnly = true)
    public List<Booking> confirmedOverlapping(Integer facilityId, OffsetDateTime start, OffsetDateTime end) {
        Specification<Booking> spec = BookingSpecifications.hasFacility(facilityId)
                .and(BookingSpecifications.hasStatus(BookingStatus.Confirmed))
                .and(BookingSpecifications.overlaps(start, end));
        return repository.findAll(spec, Sort.by("startTime", "id"));
    }

    // SRS 4.3.6: finds the bookings due for a reminder and stamps reminder_sent_at in the same transaction.
    // Stamping BEFORE sending means a booking can never be reminded twice, even if the job runs again
    // while notifications are still going out. The price: if notification-service is down at that moment,
    // that reminder is lost, which NFR-4 (notifications are best effort) accepts.
    @Transactional
    public List<Booking> claimDueReminders(OffsetDateTime now, OffsetDateTime until) {
        List<Booking> due = repository.findDueForReminder(BookingStatus.Confirmed, now, until);
        due.forEach(b -> b.markReminderSent(now));
        return due;   // dirty checking: Hibernate writes the changed rows at commit, no save() needed
    }
}
