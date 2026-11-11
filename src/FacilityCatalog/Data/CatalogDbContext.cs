using Microsoft.EntityFrameworkCore;

namespace FacilityCatalog.Data;

public enum FacilityType { Room, Lab, Equipment }
public enum FacilityStatus { Available, Maintenance }
public enum EventStatus { Scheduled, Changed, Cancelled }

public class Facility
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Building { get; set; }
    public required string Location { get; set; }
    public int Capacity { get; set; }
    public FacilityType Type { get; set; }
    public FacilityStatus Status { get; set; }
}

/// <summary>Events are independent of Facilities: they store their own building and location.</summary>
public class Event
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Category { get; set; }
    public required string Building { get; set; }
    public required string Location { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public int Capacity { get; set; }
    public EventStatus Status { get; set; }
    public List<Speaker> Speakers { get; set; } = [];
}

public class Speaker
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public required string Name { get; set; }
    public required string Affiliation { get; set; }
    public required string Bio { get; set; }
}

public class CatalogDbContext(DbContextOptions<CatalogDbContext> options) : DbContext(options)
{
    public DbSet<Facility> Facilities => Set<Facility>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Speaker> Speakers => Set<Speaker>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Facility>(e =>
        {
            e.Property(f => f.Title).HasMaxLength(120);
            e.Property(f => f.Building).HasMaxLength(80);
            e.Property(f => f.Location).HasMaxLength(120);
            e.Property(f => f.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(f => f.Status).HasConversion<string>().HasMaxLength(20);
        });

        b.Entity<Event>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(160);
            e.Property(x => x.Category).HasMaxLength(40);
            e.Property(x => x.Building).HasMaxLength(80);
            e.Property(x => x.Location).HasMaxLength(120);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasMany(x => x.Speakers).WithOne().HasForeignKey(s => s.EventId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Speaker>(e =>
        {
            e.Property(s => s.Name).HasMaxLength(120);
            e.Property(s => s.Affiliation).HasMaxLength(160);
        });
    }
}
