package com.smartcampus.booking.controller;

import com.smartcampus.booking.dto.MyItemResponse;
import com.smartcampus.booking.service.BookingService;
import com.smartcampus.booking.service.MyItemsService;
import java.util.List;
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

    public BookingController(BookingService service, MyItemsService myItemsService) {
        this.service = service;
        this.myItemsService = myItemsService;
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
