package com.smartcampus.notification.entity;

// Stored as text in notifications.type; names must match the database values exactly
public enum NotificationType {
    Confirmation,
    Reminder,
    ScheduleChange,
    Cancellation
}
