package com.smartcampus.chatbot.client;

import com.smartcampus.shared.contracts.EventResponse;
import com.smartcampus.shared.contracts.FacilityResponse;
import com.smartcampus.shared.exception.NotFoundException;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriBuilder;

// Reads facilities and events from facility-catalog's public GET endpoints (the same ones the frontend
// uses through the gateway). The chatbot owns no data, so everything it says comes from here or from
// booking-engine (data ownership, SRS 3).
@Component
public class CatalogClient {

    private static final ParameterizedTypeReference<List<FacilityResponse>> FACILITIES = new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<EventResponse>> EVENTS = new ParameterizedTypeReference<>() {};

    private final RestClient restClient;

    public CatalogClient(@Qualifier("catalogRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    // GET /api/facilities?q=&type=&building= (FR-U3)
    public List<FacilityResponse> searchFacilities(String q, String type, String building) {
        List<FacilityResponse> found = restClient.get()
                .uri(uri -> {
                    uri.path("/api/facilities");
                    optional(uri, "q", q);
                    optional(uri, "type", type);
                    optional(uri, "building", building);
                    return uri.build();
                })
                .retrieve()
                .body(FACILITIES);
        return found == null ? List.of() : found;
    }

    // GET /api/facilities/{id}
    public FacilityResponse getFacility(int id) {
        try {
            return restClient.get().uri("/api/facilities/{id}", id).retrieve().body(FacilityResponse.class);
        } catch (HttpClientErrorException.NotFound ex) {
            throw new NotFoundException("No facility with id " + id);
        }
    }

    // GET /api/events?q=&category=&building=&from=&to= (FR-U4); from/to are YYYY-MM-DD Cairo days
    public List<EventResponse> searchEvents(String q, String category, String building, String from, String to) {
        List<EventResponse> found = restClient.get()
                .uri(uri -> {
                    uri.path("/api/events");
                    optional(uri, "q", q);
                    optional(uri, "category", category);
                    optional(uri, "building", building);
                    optional(uri, "from", from);
                    optional(uri, "to", to);
                    return uri.build();
                })
                .retrieve()
                .body(EVENTS);
        return found == null ? List.of() : found;
    }

    // GET /api/events/{id}: the event plus its speakers
    public EventDetail getEvent(int id) {
        try {
            return restClient.get().uri("/api/events/{id}", id).retrieve().body(EventDetail.class);
        } catch (HttpClientErrorException.NotFound ex) {
            throw new NotFoundException("No event with id " + id);
        }
    }

    // Leaves empty filters out, so "no filter" means "all" (same rule as the frontend's queryParams)
    private static void optional(UriBuilder uri, String name, String value) {
        uri.queryParamIfPresent(name, Optional.ofNullable(value).filter(v -> !v.isBlank()));
    }
}
