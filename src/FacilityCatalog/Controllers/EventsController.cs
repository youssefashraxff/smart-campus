using FacilityCatalog.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FacilityCatalog.Controllers;

[ApiController]
[Route("api/events")]
public class EventsController(CatalogDbContext db) : ControllerBase
{
    // FR-U4: search/filter by keyword, category, building and date range
    [HttpGet]
    public async Task<ActionResult<List<Event>>> Search(
        string? q, string? category, string? building, DateTimeOffset? from, DateTimeOffset? to)
    {
        var query = db.Events.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(e => e.Title.ToLower().Contains(q.ToLower()) || e.Description.ToLower().Contains(q.ToLower()));
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(e => e.Category == category);
        if (!string.IsNullOrWhiteSpace(building))
            query = query.Where(e => e.Building == building);
        if (from is not null)
            query = query.Where(e => e.EndTime >= from);
        if (to is not null)
            query = query.Where(e => e.StartTime <= to);

        return await query.OrderBy(e => e.StartTime).ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Event>> Get(int id) =>
        await db.Events.Include(e => e.Speakers).AsNoTracking().SingleOrDefaultAsync(e => e.Id == id) is { } ev
            ? ev
            : NotFound();

    // TODO FR-A3/FR-A4/FR-A5 (Admin): POST, PUT /{id} (notify registrants on schedule change), DELETE /{id}, /{id}/speakers
}
