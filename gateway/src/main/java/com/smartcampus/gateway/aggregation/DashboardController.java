package com.smartcampus.gateway.aggregation;

import com.smartcampus.shared.contracts.MyItemResponse;
import com.smartcampus.shared.contracts.NotificationResponse;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

// FR-C3: the dashboard in ONE browser request. The gateway asks booking-engine and notification-service
// at the same time and merges the answers. Spring Security has already checked the JWT (SecurityConfig).
@RestController
public class DashboardController {

    private static final Logger log = LoggerFactory.getLogger(DashboardController.class);

    // How many items of each list the dashboard shows; the full lists have their own pages
    private static final int SHOWN = 5;

    private static final ParameterizedTypeReference<List<MyItemResponse>> ITEMS = new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<NotificationResponse>> ALERTS =
            new ParameterizedTypeReference<>() {};

    private final WebClient bookingClient;
    private final WebClient notificationClient;

    public DashboardController(@Qualifier("bookingClient") WebClient bookingClient,
                               @Qualifier("notificationClient") WebClient notificationClient) {
        this.bookingClient = bookingClient;
        this.notificationClient = notificationClient;
    }

    // @AuthenticationPrincipal gives the verified token; its "sub" is the user id
    @GetMapping("/api/dashboard")
    public Mono<DashboardResponse> dashboard(@AuthenticationPrincipal Jwt jwt) {
        // Nothing is sent yet: a Mono only describes the call. Both start when zip() subscribes to them,
        // so they run in parallel and the dashboard takes as long as the SLOWER call, not the sum (NFR-3).
        Mono<Section<MyItemResponse>> upcoming = bookingClient.get()
                .uri("/api/bookings/mine?status=active")
                .headers(headers -> asUser(headers, jwt))
                .retrieve()
                .bodyToMono(ITEMS)
                .defaultIfEmpty(List.of())      // an empty body would otherwise make zip() return nothing
                .map(Section::ok)
                // A failed or slow call becomes an empty "unavailable" section instead of an error (NFR-4)
                .onErrorResume(ex -> unavailable("booking-engine", ex));

        Mono<Section<NotificationResponse>> alerts = notificationClient.get()
                .uri("/api/notifications/mine?unread=true")
                .headers(headers -> asUser(headers, jwt))
                .retrieve()
                .bodyToMono(ALERTS)
                .defaultIfEmpty(List.of())
                .map(Section::ok)
                .onErrorResume(ex -> unavailable("notification-service", ex));

        return Mono.zip(upcoming, alerts).map(both -> {
            Section<MyItemResponse> items = both.getT1();
            Section<NotificationResponse> unread = both.getT2();
            return new DashboardResponse(
                    first(items.list()),        // booking-engine already sorts upcoming items by start time
                    first(unread.list()),       // notification-service sorts newest first
                    unread.list().size(),       // the badge counts ALL unread alerts, not just the shown ones
                    items.status(),
                    unread.status());
        });
    }

    // The same headers the routes get from UserHeadersFilter, so the services can't tell the difference
    private static void asUser(HttpHeaders headers, Jwt jwt) {
        headers.set("X-User-Id", jwt.getSubject());
        headers.set("X-User-Role", jwt.getClaimAsString("role"));
    }

    private static <T> List<T> first(List<T> list) {
        return list.subList(0, Math.min(SHOWN, list.size()));
    }

    private static <T> Mono<Section<T>> unavailable(String service, Throwable ex) {
        log.warn("Dashboard: {} unavailable: {}", service, ex.getMessage());
        return Mono.just(new Section<>(List.of(), "unavailable"));
    }

    // One half of the dashboard: its items and whether the service answered ("ok" / "unavailable")
    private record Section<T>(List<T> list, String status) {
        static <T> Section<T> ok(List<T> list) {
            return new Section<>(list, "ok");
        }
    }
}
