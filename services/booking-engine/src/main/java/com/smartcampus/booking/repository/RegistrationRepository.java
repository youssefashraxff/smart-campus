package com.smartcampus.booking.repository;

import com.smartcampus.booking.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;

// Database access for Registration. Spring Data writes the implementation at startup;
// JpaRepository<Registration, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface RegistrationRepository extends JpaRepository<Registration, Integer> {
}
