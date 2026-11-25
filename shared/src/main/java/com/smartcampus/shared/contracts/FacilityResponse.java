package com.smartcampus.shared.contracts;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// ignoreUnknown: see EventResponse
@JsonIgnoreProperties(ignoreUnknown = true)
public record FacilityResponse(
        Integer id,
        String title,
        String building,
        String location,
        Integer capacity,
        String type,
        String status) {}
