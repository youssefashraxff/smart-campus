package com.smartcampus.catalog.dto;

import com.smartcampus.shared.contracts.EventResponse;
import java.time.OffsetDateTime;
import java.util.List;

// GET /api/events/{id}: the event's fields (flat, same names as EventResponse) plus its speakers.
// Flat rather than { event, speakers } so the frontend's CampusEventDetail can simply extend CampusEvent,
// and so booking-engine can read this same answer as an EventResponse (it ignores "speakers").
public record EventDetailResponse(
        Integer id,
        String title,
        String description,
        String category,
        String building,
        String location,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        Integer capacity,
        String status,
        List<SpeakerResponse> speakers) {

    public static EventDetailResponse of(EventResponse e, List<SpeakerResponse> speakers) {
        return new EventDetailResponse(e.id(), e.title(), e.description(), e.category(), e.building(),
                e.location(), e.startTime(), e.endTime(), e.capacity(), e.status(), speakers);
    }
}
