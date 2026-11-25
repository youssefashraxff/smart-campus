package com.smartcampus.booking.client;

import com.smartcampus.shared.contracts.NotificationRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

// Sends alerts through notification-service (FR-U9). It never throws: a failing notification must not
// fail the booking or registration (NFR-4). Call it only AFTER the database transaction has committed,
// otherwise the user could be told about something that was rolled back.
@Component
public class NotificationClient {

    private static final Logger log = LoggerFactory.getLogger(NotificationClient.class);

    private final RestClient restClient;

    public NotificationClient(@Qualifier("notificationRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public void sendConfirmation(Integer userId, String message) {
        send(new NotificationRequest(userId, "Confirmation", message));
    }

    public void sendCancellation(Integer userId, String message) {
        send(new NotificationRequest(userId, "Cancellation", message));
    }

    public void sendReminder(Integer userId, String message) {
        send(new NotificationRequest(userId, "Reminder", message));
    }

    private void send(NotificationRequest request) {
        try {
            restClient.post().uri("/api/notifications").body(request).retrieve().toBodilessEntity();
        } catch (RuntimeException ex) {
            log.warn("{} notification for user {} was not sent: {}",
                    request.type(), request.userId(), ex.getMessage());
        }
    }
}
