package com.smartcampus.shared.contracts;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;

// One dashboard alert (FR-U9). Returned by notification-service and passed on by the gateway's dashboard.
@JsonIgnoreProperties(ignoreUnknown = true)
public record NotificationResponse(
        Integer id,
        String type,
        String message,
        // Named explicitly: for a boolean "isRead" Jackson could otherwise also see the method isRead()
        // as a getter for a property called "read". The frontend reads "isRead".
        @JsonProperty("isRead") boolean isRead,
        OffsetDateTime createdAt) {}
