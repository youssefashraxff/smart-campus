using FacilityCatalog.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FacilityCatalog.Controllers;

[ApiController]
[Route("api/facilities")]
public class FacilitiesController(CatalogDbContext db) : ControllerBase
{
    // FR-U3: search/filter by keyword, type and building
    [HttpGet]
    public async Task<ActionResult<List<Facility>>> Search(string? q, FacilityType? type, string? building)
    {
        var query = db.Facilities.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(f => f.Title.ToLower().Contains(q.ToLower()) || f.Location.ToLower().Contains(q.ToLower()));
        if (type is not null)
            query = query.Where(f => f.Type == type);
        if (!string.IsNullOrWhiteSpace(building))
            query = query.Where(f => f.Building == building);

        return await query.OrderBy(f => f.Building).ThenBy(f => f.Title).ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Facility>> Get(int id) =>
        await db.Facilities.FindAsync(id) is { } f ? f : NotFound();

    // TODO FR-A1/FR-A2 (Admin): POST, PUT /{id}, DELETE /{id}
}
