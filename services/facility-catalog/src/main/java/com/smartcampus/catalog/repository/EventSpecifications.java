package com.smartcampus.catalog.repository;

import com.smartcampus.catalog.entity.Event;
import java.time.OffsetDateTime;
import org.springframework.data.jpa.domain.Specification;

// One WHERE condition per event search filter (FR-U4). See FacilitySpecifications.
public final class EventSpecifications {

    private EventSpecifications() {
    }

    public static Specification<Event> matchesKeyword(String q) {
        return (event, query, cb) -> cb.or(
                SearchText.contains(cb, event.get("title"), q),
                SearchText.contains(cb, event.get("description"), q),
                SearchText.contains(cb, event.get("category"), q));
    }

    public static Specification<Event> hasCategory(String category) {
        return (event, query, cb) -> SearchText.equalsIgnoreCase(cb, event.get("category"), category);
    }

    public static Specification<Event> inBuilding(String building) {
        return (event, query, cb) -> SearchText.equalsIgnoreCase(cb, event.get("building"), building);
    }

    // end_time > :from  -> the event has not finished before the range starts
    public static Specification<Event> endsAfter(OffsetDateTime from) {
        return (event, query, cb) -> cb.greaterThan(event.get("endTime"), from);
    }

    // start_time < :to  -> the event starts before the range ends.
    // Together with endsAfter this is the overlap test (touching edges don't count, as in SRS 4.3).
    public static Specification<Event> startsBefore(OffsetDateTime to) {
        return (event, query, cb) -> cb.lessThan(event.get("startTime"), to);
    }
}
