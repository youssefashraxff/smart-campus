package com.smartcampus.catalog.dto;

public record SpeakerResponse(
        Integer id,
        String name,
        String affiliation,
        String bio) {}