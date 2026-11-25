package com.smartcampus.catalog.repository;

import com.smartcampus.catalog.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

// Database access for Facility. Spring Data writes the implementation at startup;
// JpaRepository<Facility, Integer> already gives save, findById, findAll, deleteById, count, ...
// JpaSpecificationExecutor adds findAll(specification, sort), for the search with optional filters (FR-U3).
public interface FacilityRepository extends JpaRepository<Facility, Integer>, JpaSpecificationExecutor<Facility> {
}
