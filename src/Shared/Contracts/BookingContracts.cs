namespace SmartCampus.Shared.Contracts;

public record CreateBookingRequest(int FacilityId, DateTimeOffset StartTime, DateTimeOffset EndTime);

public record BookingDto(int Id, int UserId, int FacilityId, DateTimeOffset StartTime, DateTimeOffset EndTime, string Status);

public record RegisterForEventRequest(int EventId);
