package com.smartcampus.catalog.controller;

import com.smartcampus.catalog.dto.SpeakerRequest;
import com.smartcampus.catalog.dto.SpeakerResponse;
import com.smartcampus.catalog.service.SpeakerService;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/events/{eventId}/speakers")
public class SpeakerController {

    private final SpeakerService service;

    public SpeakerController(SpeakerService service) {
        this.service = service;
    }

    @GetMapping
    public List<SpeakerResponse> list(@PathVariable Integer eventId) {
        return service.list(eventId);                                  // 200
    }

    @PostMapping
    public ResponseEntity<SpeakerResponse> add(@PathVariable Integer eventId,
                                               @Valid @RequestBody SpeakerRequest request) {
        SpeakerResponse created = service.add(eventId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);         // 201 + Location
    }

    @PutMapping("/{speakerId}")
    public SpeakerResponse update(@PathVariable Integer eventId,
                                  @PathVariable Integer speakerId,
                                  @Valid @RequestBody SpeakerRequest request) {
        return service.update(eventId, speakerId, request);            // 200
    }

    @DeleteMapping("/{speakerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)                             // 204
    public void delete(@PathVariable Integer eventId, @PathVariable Integer speakerId) {
        service.delete(eventId, speakerId);
    }
}