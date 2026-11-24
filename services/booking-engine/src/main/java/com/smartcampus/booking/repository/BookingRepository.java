package com.smartcampus.booking.repository;

import com.smartcampus.booking.entity.Booking;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;

// Database access for Booking. Spring Data writes the implementation at startup;
// JpaRepository<Booking, Integer> already gives save, findById, findAll, deleteById, count, ...
// JpaSpecificationExecutor adds findAll(specification, sort), for queries with optional filters (FR-A6).
public interface BookingRepository
        extends JpaRepository<Booking, Integer>, JpaSpecificationExecutor<Booking> {

    List<Booking> findByUserId(Integer userId);

    // findById that also locks the row (SELECT ... FOR UPDATE) until the transaction ends, so of two
    // simultaneous cancels the second waits and then sees the row is already Cancelled
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Booking> findWithLockById(Integer id);
}
