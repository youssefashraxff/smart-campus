package com.smartcampus.catalog.repository;

import com.smartcampus.catalog.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;

// Database access for Facility. Spring Data writes the implementation at startup;
// JpaRepository<Facility, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface FacilityRepository extends JpaRepository<Facility, Integer> {
}
