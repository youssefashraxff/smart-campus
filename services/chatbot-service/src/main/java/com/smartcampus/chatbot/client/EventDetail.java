package com.smartcampus.chatbot.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.OffsetDateTime;
import java.util.List;

// What GET /api/events/{id} returns (the catalog's EventDetailResponse): the event fields plus speakers.
// A local copy rather than a shared contract, because only the chatbot reads the speakers over HTTP.
@JsonIgnoreProperties(ignoreUnknown = true)
public record EventDetail(
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
        List<Speaker> speakers) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Speaker(String name, String affiliation, String bio) {}
}
