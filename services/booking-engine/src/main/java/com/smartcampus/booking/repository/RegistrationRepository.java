package com.smartcampus.booking.repository;

import com.smartcampus.booking.entity.Registration;
import com.smartcampus.booking.entity.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

// Database access for Registration. Spring Data writes the implementation at startup;
// JpaRepository<Registration, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface RegistrationRepository extends JpaRepository<Registration, Integer> {

    // How many seats of an event are taken
    long countByEventIdAndStatus(Integer eventId, RegistrationStatus status);

    boolean existsByUserIdAndEventIdAndStatus(Integer userId, Integer eventId, RegistrationStatus status);
}
