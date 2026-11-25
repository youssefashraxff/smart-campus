package com.smartcampus.gateway.aggregation;

import com.smartcampus.shared.contracts.FacilityResponse;
import com.smartcampus.shared.contracts.TimeSlot;
import java.time.LocalDate;
import java.util.List;

// GET /api/facilities/{id}/availability (FR-C3): everything the booking calendar needs in one answer.
// from/to are echoed back so the page can check the answer belongs to the week it is showing.
public record AvailabilityResponse(
        FacilityResponse facility,
        LocalDate from,
        LocalDate to,
        List<TimeSlot> bookedSlots) {}
