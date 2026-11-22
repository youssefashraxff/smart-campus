package com.smartcampus.catalog.controller;

import com.smartcampus.catalog.dto.FacilityRequest;
import com.smartcampus.catalog.service.FacilityService;
import com.smartcampus.shared.contracts.FacilityResponse;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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