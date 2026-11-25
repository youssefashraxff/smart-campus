package com.smartcampus.catalog.repository;

import com.smartcampus.catalog.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

// Database access for Event. Spring Data writes the implementation at startup;
// JpaRepository<Event, Integer> already gives save, findById, findAll, deleteById, count, ...
// JpaSpecificationExecutor adds findAll(specification, sort), for the search with optional filters (FR-U4).
public interface EventRepository extends JpaRepository<Event, Integer>, JpaSpecificationExecutor<Event> {
}
