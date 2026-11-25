package com.smartcampus.catalog.service;

import com.smartcampus.catalog.dto.FacilityRequest;
import com.smartcampus.catalog.entity.Facility;
import com.smartcampus.catalog.entity.FacilityStatus;
import com.smartcampus.catalog.entity.FacilityType;
import com.smartcampus.catalog.repository.FacilitySpecifications;
import com.smartcampus.shared.exception.NotFoundException;
import com.smartcampus.catalog.repository.FacilityRepository;
import com.smartcampus.shared.contracts.FacilityResponse;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FacilityService {

    private final FacilityRepository repository;

    public FacilityService(FacilityRepository repository) {
        this.repository = repository;
    }

    // FR-U3. Every filter is optional: null or blank means "don't filter by this".
    @Transactional(readOnly = true)
    public List<FacilityResponse> search(String q, FacilityType type, String building, FacilityStatus status) {
        // unrestricted() adds no WHERE at all; every filter that was sent adds one condition to it
        Specification<Facility> spec = Specification.unrestricted();
        if (hasText(q)) {
            spec = spec.and(FacilitySpecifications.matchesKeyword(q));
        }
        if (type != null) {
            spec = spec.and(FacilitySpecifications.hasType(type));
        }
        if (hasText(building)) {
            spec = spec.and(FacilitySpecifications.inBuilding(building));
        }
        if (status != null) {
            spec = spec.and(FacilitySpecifications.hasStatus(status));
        }
        // The id breaks ties, so facilities with the same title always come back in the same order
        return repository.findAll(spec, Sort.by("title", "id")).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public FacilityResponse get(Integer id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Facility " + id + " not found"));
    }

    @Transactional
    public FacilityResponse create(FacilityRequest r) {
        Facility saved = repository.save(new Facility(
                r.title(), r.building(), r.location(), r.capacity(), r.type(), r.status()));
        return toResponse(saved);
    }

    @Transactional
    public FacilityResponse update(Integer id, FacilityRequest r) {
        Facility f = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Facility " + id + " not found"));
        f.update(r.title(), r.building(), r.location(), r.capacity(), r.type(), r.status());
        return toResponse(f);
    }

    @Transactional
    public void delete(Integer id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Facility " + id + " not found");
        }
        repository.deleteById(id);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private FacilityResponse toResponse(Facility f) {
        return new FacilityResponse(f.getId(), f.getTitle(), f.getBuilding(), f.getLocation(),
                f.getCapacity(), f.getType().name(), f.getStatus().name());
    }
}