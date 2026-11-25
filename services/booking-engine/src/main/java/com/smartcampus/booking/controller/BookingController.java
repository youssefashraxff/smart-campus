package com.smartcampus.booking.controller;

import com.smartcampus.booking.dto.AdminBookingsResponse;
import com.smartcampus.booking.dto.BookingRequest;
import com.smartcampus.booking.dto.BookingResponse;
import com.smartcampus.booking.service.AdminBookingsService;
import com.smartcampus.booking.service.BookingService;
import com.smartcampus.booking.service.CalendarService;
import com.smartcampus.booking.service.MyItemsService;
import com.smartcampus.shared.contracts.MyItemResponse;
import com.smartcampus.shared.exception.ForbiddenException;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    // text/calendar is the media type of .ics files (RFC 5545)
    private static final MediaType TEXT_CALENDAR = new MediaType("text", "calendar", StandardCharsets.UTF_8);

    private final BookingService service;
    private final MyItemsService myItemsService;
    private final AdminBookingsService adminBookingsService;
    private final CalendarService calendarService;

    public BookingController(BookingService service, MyItemsService myItemsService,
                             AdminBookingsService adminBookingsService, CalendarService calendarService) {
        this.service = service;
        this.myItemsService = myItemsService;
        this.adminBookingsService = adminBookingsService;
        this.calendarService = calendarService;
    }

    // FR-U5. X-User-Id is set by the gateway from the JWT.
    // 400 bad times, 404 unknown facility, 409 overlap or maintenance, 503 catalog down.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)                          // 201
    public BookingResponse reserve(@RequestHeader("X-User-Id") Integer userId,
                                   @Valid @RequestBody BookingRequest request) {
        return service.reserve(userId, request);
    }

    // FR-A6, admins only. Every filter is optional; date is a Cairo calendar day (YYYY-MM-DD).
    // facilityId and date filter the bookings, eventId filters the registrations. date does NOT filter
    // registrations, which have no time of their own.
    // The gateway checks the role too; checking here as well keeps the service safe without the gateway.
    // The header is not required, so that a missing role gives 403 and not 400.
    @GetMapping
    public AdminBookingsResponse all(
            @RequestHeader(name = "X-User-Role", required = false) String role,
            @RequestParam(required = false) Integer facilityId,
            @RequestParam(required = false) Integer eventId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (!"Admin".equals(role)) {
            throw new ForbiddenException("Only admins can list all bookings");
        }
        return adminBookingsService.list(facilityId, eventId, date);
    }

    // X-User-Id is set by the gateway from the JWT.
    // status is "active" (the default) or "past"; the list holds bookings AND registrations.
    @GetMapping("/mine")
    public List<MyItemResponse> mine(@RequestHeader("X-User-Id") Integer userId,
                                     @RequestParam(defaultValue = "active") String status) {
        return myItemsService.listMine(userId, status);
    }

    // FR-U11. The browser saves the answer as smart-campus.ics ("attachment"), which a calendar app opens.
    @GetMapping("/calendar.ics")
    public ResponseEntity<String> calendar(@RequestHeader("X-User-Id") Integer userId) {
        ContentDisposition attachment = ContentDisposition.attachment().filename("smart-campus.ics").build();
        return ResponseEntity.ok()
                .contentType(TEXT_CALENDAR)
                .header(HttpHeaders.CONTENT_DISPOSITION, attachment.toString())
                .body(calendarService.exportFor(userId));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)                       // 204
    public void cancel(@RequestHeader("X-User-Id") Integer userId, @PathVariable Integer id) {
        service.cancel(userId, id);
    }
}
