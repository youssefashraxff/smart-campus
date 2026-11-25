package com.smartcampus.booking.repository;

import com.smartcampus.booking.entity.Registration;
import com.smartcampus.booking.entity.RegistrationStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// Database access for Registration. Spring Data writes the implementation at startup;
// JpaRepository<Registration, Integer> already gives save, findById, findAll, deleteById, count, ...
// JpaSpecificationExecutor adds findAll(specification, sort), for queries with optional filters (FR-A6).
public interface RegistrationRepository
        extends JpaRepository<Registration, Integer>, JpaSpecificationExecutor<Registration> {

    // How many seats of an event are taken
    long countByEventIdAndStatus(Integer eventId, RegistrationStatus status);

    boolean existsByUserIdAndEventIdAndStatus(Integer userId, Integer eventId, RegistrationStatus status);

    List<Registration> findByUserId(Integer userId);

    // findById that also locks the row (SELECT ... FOR UPDATE) until the transaction ends, so of two
    // simultaneous cancels the second waits and then sees the row is already Cancelled
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Registration> findWithLockById(Integer id);

    // FR-A5: who to tell when an event moves or is cancelled. Only the user ids, not whole rows.
    @Query("SELECT DISTINCT r.userId FROM Registration r WHERE r.eventId = :eventId AND r.status = :status")
    List<Integer> findUserIdsByEventIdAndStatus(@Param("eventId") Integer eventId,
                                                @Param("status") RegistrationStatus status);
}
