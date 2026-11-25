package com.smartcampus.gateway.aggregation;

import com.smartcampus.shared.contracts.FacilityResponse;
import com.smartcampus.shared.contracts.TimeSlot;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.NotFoundException;
import com.smartcampus.shared.exception.ServiceUnavailableException;
import java.time.LocalDate;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

// FR-C3: a facility plus its booked slots for one calendar view, in one browser request.
//
// Why this path is answered here and not proxied by the "facility-catalog" route (/api/facilities/**):
// WebFlux checks @RestController mappings (order 0) before the gateway's route mapping (order 1), so this
// exact path is handled by this class and every other /api/facilities/... path still goes to the catalog.
@RestController
public class AvailabilityController {

    private static final Logger log = LoggerFactory.getLogger(AvailabilityController.class);

    private static final int MAX_RANGE_DAYS = 31;
    private static final ParameterizedTypeReference<List<TimeSlot>> SLOTS = new ParameterizedTypeReference<>() {};

    private final WebClient catalogClient;
    private final WebClient bookingClient;

    public AvailabilityController(@Qualifier("catalogClient") WebClient catalogClient,
                                  @Qualifier("bookingClient") WebClient bookingClient) {
        this.catalogClient = catalogClient;
        this.bookingClient = bookingClient;
    }

    // from/to: YYYY-MM-DD Cairo days, both inclusive (week view: Saturday..Friday; day view: same date twice)
    @GetMapping("/api/facilities/{id}/availability")
    public Mono<AvailabilityResponse> availability(
            @PathVariable Integer id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        // Checked before calling anyone: a bad request should not cost two service calls
        if (to.isBefore(from)) {
            throw new BadRequestException("to must not be before from");
        }
        if (to.isAfter(from.plusDays(MAX_RANGE_DAYS - 1))) {
            throw new BadRequestException("The range can be at most " + MAX_RANGE_DAYS + " days");
        }

        Mono<FacilityResponse> facility = catalogClient.get()
                .uri("/api/facilities/{id}", id)
                .retrieve()
                .bodyToMono(FacilityResponse.class)
                .onErrorMap(ex -> toError("Facility catalog", id, ex));

        Mono<List<TimeSlot>> slots = bookingClient.get()
                .uri(uri -> uri.path("/internal/facilities/{id}/booked-slots")
                        .queryParam("from", from)
                        .queryParam("to", to)
                        .build(id))
                .retrieve()
                .bodyToMono(SLOTS)
                .defaultIfEmpty(List.of())
                .onErrorMap(ex -> toError("Booking engine", id, ex));

        // Both calls run in parallel. Unlike the dashboard, BOTH parts are required: a calendar without its
        // booked slots would show taken times as free, so if either fails the whole request fails
        // (404 unknown facility, otherwise 503), and zip cancels the other call.
        return Mono.zip(facility, slots)
                .map(both -> new AvailabilityResponse(both.getT1(), from, to, both.getT2()));
    }

    // WebClient errors -> our exceptions, which GatewayExceptionHandler turns into 404 / 503 ProblemDetail
    private static Throwable toError(String service, Integer id, Throwable ex) {
        if (ex instanceof WebClientResponseException.NotFound) {
            return new NotFoundException("Facility " + id + " not found");
        }
        log.warn("Availability: {} failed for facility {}: {}", service, id, ex.getMessage());
        return new ServiceUnavailableException(service + " is unavailable, please try again later", ex);
    }
}
