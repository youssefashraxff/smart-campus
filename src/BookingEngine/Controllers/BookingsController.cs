using System.Data;
using BookingEngine.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampus.Shared.Contracts;

namespace BookingEngine.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController(BookingDbContext db, IHttpClientFactory http, ILogger<BookingsController> log) : ControllerBase
{
    // TEMPORARY until JWT (FR-U2): the caller's user id comes from this header.
    private int? CurrentUserId => int.TryParse(Request.Headers["X-User-Id"], out var id) ? id : null;

    // FR-U7: own bookings, active or past
    [HttpGet("mine")]
    public async Task<ActionResult<List<BookingDto>>> Mine(string status = "active")
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        var now = DateTimeOffset.UtcNow;

        var query = db.Bookings.AsNoTracking().Where(b => b.UserId == userId);
        query = status == "past"
            ? query.Where(b => b.EndTime < now)
            : query.Where(b => b.EndTime >= now && b.Status == BookingStatus.Confirmed);

        return await query.OrderBy(b => b.StartTime).Select(b => ToDto(b)).ToListAsync();
    }

    // FR-U5: reserve a facility slot; rejects overlaps (business rules 4.3)
    [HttpPost]
    public async Task<ActionResult<BookingDto>> Create(CreateBookingRequest req)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        if (req.EndTime <= req.StartTime) return BadRequest("End time must be after start time.");
        if (req.StartTime < DateTimeOffset.UtcNow) return BadRequest("Cannot book in the past.");

        // Facility must exist and be available (owned by the Facility Catalog service)
        var facilityResponse = await http.CreateClient("catalog").GetAsync($"/api/facilities/{req.FacilityId}");
        if (facilityResponse.StatusCode == System.Net.HttpStatusCode.NotFound) return NotFound("Facility not found.");
        facilityResponse.EnsureSuccessStatusCode();
        var facility = (await facilityResponse.Content.ReadFromJsonAsync<FacilityStatusDto>())!;
        if (facility.Status == "Maintenance") return Conflict("Facility is under maintenance.");

        // Overlap check + insert in ONE serializable transaction: two simultaneous requests can't both win
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var overlaps = await db.Bookings.AnyAsync(b =>
            b.FacilityId == req.FacilityId &&
            b.Status == BookingStatus.Confirmed &&
            b.StartTime < req.EndTime &&
            req.StartTime < b.EndTime);
        if (overlaps) return Conflict("This slot overlaps an existing booking.");

        var booking = new Booking
        {
            UserId = userId,
            FacilityId = req.FacilityId,
            StartTime = req.StartTime,
            EndTime = req.EndTime,
            Status = BookingStatus.Confirmed,
        };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync();
        await tx.CommitAsync();

        // Notification failure must not fail the booking (NFR-4)
        try
        {
            await http.CreateClient("notifications").PostAsJsonAsync("/api/notifications",
                new CreateNotificationRequest(userId, NotificationType.Confirmation,
                    $"Your booking for {facility.Title} on {req.StartTime:ddd d MMM, HH:mm}–{req.EndTime:HH:mm} is confirmed."));
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "Booking {BookingId} saved but confirmation notification failed", booking.Id);
        }

        return CreatedAtAction(nameof(Mine), ToDto(booking));
    }

    // FR-U8: cancel own upcoming booking
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();

        var booking = await db.Bookings.FindAsync(id);
        if (booking is null || booking.UserId != userId) return NotFound();
        if (booking.StartTime <= DateTimeOffset.UtcNow) return BadRequest("Past or ongoing bookings cannot be cancelled.");

        booking.Status = BookingStatus.Cancelled;
        await db.SaveChangesAsync();
        return NoContent();
    }

    // TODO FR-A6 (Admin): GET /api/bookings?facilityId=&date=   ·   FR-U11: GET /api/bookings/calendar.ics

    private static BookingDto ToDto(Booking b) =>
        new(b.Id, b.UserId, b.FacilityId, b.StartTime, b.EndTime, b.Status.ToString());

    private record FacilityStatusDto(int Id, string Title, string Status);
}
