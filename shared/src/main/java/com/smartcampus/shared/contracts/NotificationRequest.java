package com.smartcampus.shared.contracts;

// Body of POST /api/notifications (internal, service-to-service).
// type is the name of a NotificationType: Confirmation, Reminder, ScheduleChange or Cancellation.
public record NotificationRequest(
        Integer userId,
        String type,
        String message) {}
