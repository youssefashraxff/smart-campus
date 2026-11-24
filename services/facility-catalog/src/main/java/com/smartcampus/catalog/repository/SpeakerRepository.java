package com.smartcampus.catalog.repository;

import com.smartcampus.catalog.entity.Speaker;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

// Database access for Speaker. Spring Data writes the implementation at startup;
// JpaRepository<Speaker, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface SpeakerRepository extends JpaRepository<Speaker, Integer> {

    // Spring Data builds the query from the method name:
    // ... WHERE event_id = ? ORDER BY name ASC
    List<Speaker> findByEventIdOrderByNameAsc(Integer eventId);

    // ... WHERE id = ? AND event_id = ?  -> a speaker can only be reached through its own event
    Optional<Speaker> findByIdAndEventId(Integer id, Integer eventId);
}
