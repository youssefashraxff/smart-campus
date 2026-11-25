package com.smartcampus.shared.contracts;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.OffsetDateTime;

// A taken time range of a facility, with no user id (privacy): what the availability calendar shows.
// Sent by booking-engine's /internal/facilities/{id}/booked-slots and passed on by the gateway (FR-C3).
@JsonIgnoreProperties(ignoreUnknown = true)
public record TimeSlot(OffsetDateTime startTime, OffsetDateTime endTime) {}
