package com.smartcampus.notification.controller;

import com.smartcampus.notification.service.NotificationService;
import com.smartcampus.shared.contracts.NotificationRequest;
import com.smartcampus.shared.contracts.NotificationResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    // Internal (FR-U9, FR-A5): booking-engine and facility-catalog call this on port 5004.
    // The gateway denies POST /api/notifications/**, so users can't send alerts to each other.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)                          // 201
    public NotificationResponse create(@RequestBody NotificationRequest request) {
        return service.create(request);
    }

    // FR-U9. X-User-Id is set by the gateway from the JWT. ?unread=true -> only unread ones.
    @GetMapping("/mine")
    public List<NotificationResponse> mine(@RequestHeader("X-User-Id") Integer userId,
                                           @RequestParam(defaultValue = "false") boolean unread) {
        return service.listMine(userId, unread);
    }

    // FR-U10
    @PutMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)                       // 204
    public void markRead(@RequestHeader("X-User-Id") Integer userId, @PathVariable Integer id) {
        service.markRead(userId, id);
    }
}
