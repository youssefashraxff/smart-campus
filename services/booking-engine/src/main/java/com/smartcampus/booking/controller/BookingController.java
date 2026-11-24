package com.smartcampus.booking.controller;

import com.smartcampus.booking.dto.AdminBookingsResponse;
import com.smartcampus.booking.dto.MyItemResponse;
import com.smartcampus.booking.service.AdminBookingsService;
import com.smartcampus.booking.service.BookingService;
import com.smartcampus.booking.service.MyItemsService;
import com.smartcampus.shared.exception.ForbiddenException;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService service;
    private final MyItemsService myItemsService;
    private final AdminBookingsService adminBookingsService;

    public BookingController(BookingService service, MyItemsService myItemsService,
                             AdminBookingsService adminBookingsService) {
        this.service = service;
        this.myItemsService = myItemsService;
        this.adminBookingsService = adminBookingsService;
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

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)                       // 204
    public void cancel(@RequestHeader("X-User-Id") Integer userId, @PathVariable Integer id) {
        service.cancel(userId, id);
    }
}
