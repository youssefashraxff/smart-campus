package com.smartcampus.booking.repository;

import com.smartcampus.booking.entity.Registration;
import com.smartcampus.booking.entity.RegistrationStatus;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

// Database access for Registration. Spring Data writes the implementation at startup;
// JpaRepository<Registration, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface RegistrationRepository extends JpaRepository<Registration, Integer> {

    // How many seats of an event are taken
    long countByEventIdAndStatus(Integer eventId, RegistrationStatus status);

    boolean existsByUserIdAndEventIdAndStatus(Integer userId, Integer eventId, RegistrationStatus status);

    // findById that also locks the row (SELECT ... FOR UPDATE) until the transaction ends, so of two
    // simultaneous cancels the second waits and then sees the row is already Cancelled
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Registration> findWithLockById(Integer id);
}
