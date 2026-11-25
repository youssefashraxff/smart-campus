package com.smartcampus.catalog.client;

import com.smartcampus.shared.contracts.NotificationRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

// Sends one alert through notification-service. Never throws (NFR-4): one user's failed alert
// must not stop the others. Same pattern as booking-engine's NotificationClient.
@Component
public class NotificationClient {

    private static final Logger log = LoggerFactory.getLogger(NotificationClient.class);

    private final RestClient restClient;

    public NotificationClient(@Qualifier("notificationRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public void send(Integer userId, String type, String message) {
        try {
            restClient.post().uri("/api/notifications")
                    .body(new NotificationRequest(userId, type, message))
                    .retrieve().toBodilessEntity();
        } catch (RuntimeException ex) {
            log.warn("{} notification for user {} was not sent: {}", type, userId, ex.getMessage());
        }
    }
}
