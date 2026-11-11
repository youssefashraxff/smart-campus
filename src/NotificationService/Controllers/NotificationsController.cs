using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using SmartCampus.Shared.Contracts;

namespace NotificationService.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController(NotificationDbContext db) : ControllerBase
{
    private int? CurrentUserId => int.TryParse(Request.Headers["X-User-Id"], out var id) ? id : null;

    // Internal: called by Booking Engine / Facility Catalog (FR-U9, FR-A5)
    [HttpPost]
    public async Task<IActionResult> Create(CreateNotificationRequest req)
    {
        db.Notifications.Add(new Notification { UserId = req.UserId, Type = req.Type, Message = req.Message });
        await db.SaveChangesAsync();
        // TODO: if req.SendEmail, send via SMTP (MailKit + Mailtrap in development)
        return Accepted();
    }

    // FR-U9: dashboard alerts
    [HttpGet("mine")]
    public async Task<ActionResult<List<Notification>>> Mine(bool unread = false)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();

        var query = db.Notifications.AsNoTracking().Where(n => n.UserId == userId);
        if (unread) query = query.Where(n => !n.IsRead);

        return await query.OrderByDescending(n => n.CreatedAt).ToListAsync();
    }

    // FR-U10
    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();

        var n = await db.Notifications.FindAsync(id);
        if (n is null || n.UserId != userId) return NotFound();

        n.IsRead = true;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
