package com.smartcampus.catalog.repository;

import com.smartcampus.catalog.entity.Speaker;
import org.springframework.data.jpa.repository.JpaRepository;

// Database access for Speaker. Spring Data writes the implementation at startup;
// JpaRepository<Speaker, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface SpeakerRepository extends JpaRepository<Speaker, Integer> {
}
