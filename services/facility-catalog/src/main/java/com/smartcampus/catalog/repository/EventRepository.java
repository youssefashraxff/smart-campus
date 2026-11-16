package com.smartcampus.catalog.repository;

import com.smartcampus.catalog.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

// Database access for Event. Spring Data writes the implementation at startup;
// JpaRepository<Event, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface EventRepository extends JpaRepository<Event, Integer> {
}
