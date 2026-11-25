package com.smartcampus.catalog.notify;

// "Tell everyone registered for this event" (FR-A5). EventService publishes it INSIDE its transaction;
// EventChangeNotifier receives it only AFTER that transaction has committed.
// type is a NotificationType name: "ScheduleChange" or "Cancellation".
public record EventScheduleChanged(Integer eventId, String type, String message) {

    public static EventScheduleChanged changed(Integer eventId, String message) {
        return new EventScheduleChanged(eventId, "ScheduleChange", message);
    }

    public static EventScheduleChanged cancelled(Integer eventId, String message) {
        return new EventScheduleChanged(eventId, "Cancellation", message);
    }
}
