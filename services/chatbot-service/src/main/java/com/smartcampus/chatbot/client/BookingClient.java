package com.smartcampus.chatbot.client;

import com.smartcampus.shared.contracts.TimeSlot;
import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

// Reads from booking-engine's /internal/** endpoints. They are for services only (the gateway denies
// them), which is why the chatbot, as a service, may call them directly.
@Component
public class BookingClient {

    private static final ParameterizedTypeReference<List<TimeSlot>> SLOTS = new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<Integer>> USER_IDS = new ParameterizedTypeReference<>() {};

    private final RestClient restClient;

    public BookingClient(@Qualifier("bookingRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    // The same endpoint the gateway's availability aggregation uses (FR-C3). from/to inclusive Cairo days.
    public List<TimeSlot> bookedSlots(int facilityId, LocalDate from, LocalDate to) {
        List<TimeSlot> slots = restClient.get()
                .uri(uri -> uri.path("/internal/facilities/{id}/booked-slots")
                        .queryParam("from", from)
                        .queryParam("to", to)
                        .build(facilityId))
                .retrieve()
                .body(SLOTS);
        return slots == null ? List.of() : slots;
    }

    // Number of active registrations, to answer "are there places left?" (FR-B2)
    public int registeredCount(int eventId) {
        List<Integer> ids = restClient.get()
                .uri("/internal/events/{id}/registered-users", eventId)
                .retrieve()
                .body(USER_IDS);
        return ids == null ? 0 : ids.size();
    }
}
