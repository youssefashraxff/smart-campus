package com.smartcampus.shared.contracts;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.OffsetDateTime;

// ignoreUnknown ("tolerant reader"): GET /api/events/{id} returns these fields PLUS speakers.
// booking-engine reads that answer into this record and simply skips the fields it doesn't need,
// so the catalog can add fields without breaking its callers.
@JsonIgnoreProperties(ignoreUnknown = true)
public record EventResponse(
        Integer id,
        String title,
        String description,
        String category,
        String building,
        String location,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        Integer capacity,
        String status) {}
