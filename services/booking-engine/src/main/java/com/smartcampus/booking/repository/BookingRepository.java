package com.smartcampus.booking.repository;

import com.smartcampus.booking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

// Database access for Booking. Spring Data writes the implementation at startup;
// JpaRepository<Booking, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface BookingRepository extends JpaRepository<Booking, Integer> {
}
