package com.smartcampus.catalog.repository;

import com.smartcampus.catalog.entity.Facility;
import com.smartcampus.catalog.entity.FacilityStatus;
import com.smartcampus.catalog.entity.FacilityType;
import org.springframework.data.jpa.domain.Specification;

// One WHERE condition per search filter (FR-U3). FacilityService joins the ones the user sent with and(),
// so 4 optional filters don't need 16 repository methods. Same idea as booking-engine's BookingSpecifications.
public final class FacilitySpecifications {

    private FacilitySpecifications() {
    }

    // The keyword can be in the title, the building or the location
    public static Specification<Facility> matchesKeyword(String q) {
        return (facility, query, cb) -> cb.or(
                SearchText.contains(cb, facility.get("title"), q),
                SearchText.contains(cb, facility.get("building"), q),
                SearchText.contains(cb, facility.get("location"), q));
    }

    public static Specification<Facility> hasType(FacilityType type) {
        return (facility, query, cb) -> cb.equal(facility.get("type"), type);
    }

    public static Specification<Facility> inBuilding(String building) {
        return (facility, query, cb) -> SearchText.equalsIgnoreCase(cb, facility.get("building"), building);
    }

    public static Specification<Facility> hasStatus(FacilityStatus status) {
        return (facility, query, cb) -> cb.equal(facility.get("status"), status);
    }
}
