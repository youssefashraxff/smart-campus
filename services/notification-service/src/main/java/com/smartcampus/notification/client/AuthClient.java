package com.smartcampus.notification.client;

import com.smartcampus.shared.contracts.UserContact;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

// Looks up where to send a user's email. The users table belongs to auth-service, so we ask it over HTTP
// (internal endpoint, not routed by the gateway) instead of reading the table.
@Component
public class AuthClient {

    private final RestClient restClient;

    public AuthClient(@Qualifier("authRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    // Throws on 404 / timeout; EmailSender catches everything, so a failed lookup only skips the email
    public UserContact getContact(Integer userId) {
        return restClient.get().uri("/internal/users/{id}", userId).retrieve().body(UserContact.class);
    }
}
