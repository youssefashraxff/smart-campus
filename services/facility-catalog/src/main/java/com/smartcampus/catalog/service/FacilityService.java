package com.smartcampus.catalog.service;

import com.smartcampus.catalog.dto.FacilityRequest;
import com.smartcampus.catalog.entity.Facility;
import com.smartcampus.catalog.exception.NotFoundException;
import com.smartcampus.catalog.repository.FacilityRepository;
import com.smartcampus.shared.contracts.FacilityResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FacilityService {

    private final FacilityRepository repository;

    public FacilityService(FacilityRepository repository) {
        this.repository = repository;
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

    private FacilityResponse toResponse(Facility f) {
        return new FacilityResponse(f.getId(), f.getTitle(), f.getBuilding(), f.getLocation(),
                f.getCapacity(), f.getType().name(), f.getStatus().name());
    }
}