namespace SmartCampus.Shared.Contracts;

public enum NotificationType { Confirmation, Reminder, ScheduleChange, Cancellation }

/// <summary>Sent by the Booking Engine and Facility Catalog to POST /api/notifications.</summary>
public record CreateNotificationRequest(int UserId, NotificationType Type, string Message, bool SendEmail = true);
