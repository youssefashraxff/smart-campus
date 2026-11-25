package com.smartcampus.booking.repository;

import com.smartcampus.booking.entity.Booking;
import com.smartcampus.booking.entity.BookingStatus;
import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// Database access for Booking. Spring Data writes the implementation at startup;
// JpaRepository<Booking, Integer> already gives save, findById, findAll, deleteById, count, ...
// JpaSpecificationExecutor adds findAll(specification, sort) and exists(specification), for queries
// built from BookingSpecifications (FR-A6 filters, FR-U5 overlap check, FR-C3 booked slots).
public interface BookingRepository
        extends JpaRepository<Booking, Integer>, JpaSpecificationExecutor<Booking> {

    List<Booking> findByUserId(Integer userId);

    // findById that also locks the row (SELECT ... FOR UPDATE) until the transaction ends, so of two
    // simultaneous cancels the second waits and then sees the row is already Cancelled
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Booking> findWithLockById(Integer id);

    // SRS 4.3.6: bookings that start within the reminder window and were not reminded yet.
    // JPQL (entity and field names, not table names), written out because a derived method name
    // for four conditions would be unreadable.
    @Query("""
            SELECT b FROM Booking b
            WHERE b.status = :status
              AND b.reminderSentAt IS NULL
              AND b.startTime > :now
              AND b.startTime <= :until
            ORDER BY b.startTime, b.id
            """)
    List<Booking> findDueForReminder(@Param("status") BookingStatus status,
                                     @Param("now") OffsetDateTime now,
                                     @Param("until") OffsetDateTime until);
}
