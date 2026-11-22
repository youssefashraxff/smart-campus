package com.smartcampus.catalog.dto;

import com.smartcampus.catalog.entity.FacilityStatus;
import com.smartcampus.catalog.entity.FacilityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record FacilityRequest(
        @NotBlank String title,
        @NotBlank String building,
        @NotBlank String location,
        @NotNull @Positive Integer capacity,
        @NotNull FacilityType type,
        @NotNull FacilityStatus status) {}