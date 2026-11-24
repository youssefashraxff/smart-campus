package com.smartcampus.booking.client;

import com.smartcampus.shared.contracts.EventResponse;
import com.smartcampus.shared.contracts.FacilityResponse;
import com.smartcampus.shared.exception.NotFoundException;
import com.smartcampus.shared.exception.ServiceUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

// Reads facility-catalog's data through its API (we never touch its tables).
// Always call it OUTSIDE a transaction, so a slow catalog never keeps a database transaction open.
@Component
public class CatalogClient {

    private static final Logger log = LoggerFactory.getLogger(CatalogClient.class);

    private final RestClient restClient;

    public CatalogClient(@Qualifier("catalogRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public EventResponse getEvent(Integer id) {
        return get("Event", "/api/events/{id}", id, EventResponse.class);
    }

    public FacilityResponse getFacility(Integer id) {
        return get("Facility", "/api/facilities/{id}", id, FacilityResponse.class);
    }

    private <T> T get(String name, String path, Integer id, Class<T> type) {
        log.debug("Fetching {} {} from facility-catalog", name, id);
        try {
            return restClient.get().uri(path, id).retrieve().body(type);
        } catch (HttpClientErrorException.NotFound ex) {
            throw new NotFoundException(name + " " + id + " not found");
        } catch (RestClientException ex) {
            // Connection refused, timeout, or an answer we cannot use (e.g. a 500 from the catalog)
            log.warn("Fetching {} {} from facility-catalog failed: {}", name, id, ex.getMessage());
            throw new ServiceUnavailableException("Facility catalog is unavailable, please try again later", ex);
        }
    }
}
