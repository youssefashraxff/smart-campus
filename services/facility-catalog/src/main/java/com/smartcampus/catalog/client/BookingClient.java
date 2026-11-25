package com.smartcampus.catalog.client;

import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

// Asks booking-engine who is registered for an event. Registrations are booking-engine's table,
// so the catalog never reads them directly (data ownership, SRS 3).
@Component
public class BookingClient {

    // List<Integer> can't be written as List<Integer>.class (generics are erased at runtime);
    // the anonymous subclass keeps the full type so the JSON array is read as Integers
    private static final ParameterizedTypeReference<List<Integer>> USER_IDS = new ParameterizedTypeReference<>() {};

    private final RestClient restClient;

    public BookingClient(@Qualifier("bookingRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    // Internal endpoint: /internal/** is not routed by the gateway, so only services can call it
    public List<Integer> registeredUserIds(Integer eventId) {
        List<Integer> ids = restClient.get()
                .uri("/internal/events/{eventId}/registered-users", eventId)
                .retrieve()
                .body(USER_IDS);
        return ids == null ? List.of() : ids;
    }
}
