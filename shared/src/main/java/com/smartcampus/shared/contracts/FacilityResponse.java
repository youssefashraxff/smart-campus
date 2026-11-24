package com.smartcampus.shared.contracts;

public record FacilityResponse(
        Integer id,
        String title,
        String building,
        String location,
        Integer capacity,
        String type,
        String status) {}
