package com.smartcampus.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record SpeakerRequest(
        @NotBlank String name,
        @NotBlank String affiliation,
        @NotBlank String bio) {}