package com.smartcampus.catalog.controller;

import com.smartcampus.catalog.dto.FacilityRequest;
import com.smartcampus.catalog.entity.FacilityStatus;
import com.smartcampus.catalog.entity.FacilityType;
import com.smartcampus.catalog.service.FacilityService;
import com.smartcampus.shared.contracts.FacilityResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final FacilityService service;

    public FacilityController(FacilityService service) {
        this.service = service;
    }

    // FR-U3: GET /api/facilities?q=&type=&building=&status= (all optional).
    // type and status are bound straight to the enums; an unknown value (type=Pool) is a 400.
    @GetMapping
    public List<FacilityResponse> search(@RequestParam(required = false) String q,
                                         @RequestParam(required = false) FacilityType type,
                                         @RequestParam(required = false) String building,
                                         @RequestParam(required = false) FacilityStatus status) {
        return service.search(q, type, building, status);       // 200
    }

    @GetMapping("/{id}")
    public FacilityResponse get(@PathVariable Integer id) {
        return service.get(id);                                  // 200 or 404
    }

    @PostMapping
    public ResponseEntity<FacilityResponse> create(@Valid @RequestBody FacilityRequest request) {
        FacilityResponse created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);   // 201 + Location header
    }

    @PutMapping("/{id}")
    public FacilityResponse update(@PathVariable Integer id,
                                   @Valid @RequestBody FacilityRequest request) {
        return service.update(id, request);                      // 200
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)                       // 204
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}