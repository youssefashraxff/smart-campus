package com.smartcampus.catalog.controller;

import com.smartcampus.catalog.dto.EventDetailResponse;
import com.smartcampus.catalog.dto.EventRequest;
import com.smartcampus.catalog.service.EventService;
import com.smartcampus.shared.contracts.EventResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/events")
public class EventController {

    private final EventService service;

    public EventController(EventService service) {
        this.service = service;
    }

    // FR-U4: GET /api/events?q=&category=&building=&from=&to= (all optional).
    // from/to are YYYY-MM-DD Cairo days, both inclusive; a malformed date is a 400.
    @GetMapping
    public List<EventResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.search(q, category, building, from, to);   // 200
    }

    // The event and its speakers (FR-A3, FR-A4)
    @GetMapping("/{id}")
    public EventDetailResponse get(@PathVariable Integer id) {
        return service.get(id);                                    // 200 or 404
    }

    @PostMapping
    public ResponseEntity<EventResponse> create(@Valid @RequestBody EventRequest request) {
        EventResponse created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);   // 201 + Location
    }

    @PutMapping("/{id}")
    public EventResponse update(@PathVariable Integer id,
                                @Valid @RequestBody EventRequest request) {
        return service.update(id, request);                      // 200
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)                       // 204
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}