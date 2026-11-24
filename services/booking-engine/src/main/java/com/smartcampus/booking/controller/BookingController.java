package com.smartcampus.booking.controller;

import com.smartcampus.booking.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService service;

    public BookingController(BookingService service) {
        this.service = service;
    }

    // X-User-Id is set by the gateway from the JWT
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)                       // 204
    public void cancel(@RequestHeader("X-User-Id") Integer userId, @PathVariable Integer id) {
        service.cancel(userId, id);
    }
}
