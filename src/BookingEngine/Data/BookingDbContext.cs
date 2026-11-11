using Microsoft.EntityFrameworkCore;

namespace BookingEngine.Data;

public enum BookingStatus { Confirmed, Cancelled }
public enum RegistrationStatus { Registered, Cancelled }

// UserId / FacilityId / EventId belong to other services: no foreign keys, validated via their APIs.
public class Booking
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int FacilityId { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public BookingStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class Registration
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int EventId { get; set; }
    public RegistrationStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class BookingDbContext(DbContextOptions<BookingDbContext> options) : DbContext(options)
{
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Registration> Registrations => Set<Registration>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Booking>(e =>
        {
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => new { x.FacilityId, x.StartTime });
        });

        b.Entity<Registration>(e =>
        {
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            // One active registration per user per event
            e.HasIndex(x => new { x.UserId, x.EventId })
                .IsUnique()
                .HasFilter("\"Status\" = 'Registered'");
        });
    }
}
