package com.smartcampus.shared.contracts;

import java.time.OffsetDateTime;

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
