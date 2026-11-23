package com.smartcampus.catalog.repository;

import com.smartcampus.catalog.entity.Speaker;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpeakerRepository extends JpaRepository<Speaker, Integer> {

    List<Speaker> findByEventIdOrderByNameAsc(Integer eventId);

    Optional<Speaker> findByIdAndEventId(Integer id, Integer eventId);
}