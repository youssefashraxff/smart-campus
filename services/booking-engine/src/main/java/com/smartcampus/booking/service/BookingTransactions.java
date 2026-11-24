package com.smartcampus.booking.service;

import com.smartcampus.booking.entity.Booking;
import com.smartcampus.booking.entity.BookingStatus;
import com.smartcampus.booking.repository.BookingRepository;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.ConflictException;
import com.smartcampus.shared.exception.NotFoundException;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// The database part of bookings, in its own bean so that @Transactional works
// (see RegistrationTransactions)
@Service
public class BookingTransactions {

    private final BookingRepository repository;

    public BookingTransactions(BookingRepository repository) {
        this.repository = repository;
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
}
