using Microsoft.EntityFrameworkCore;

namespace AuthService.Data;

public enum Role { Student, Faculty, Admin }

public class User
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string UniversityId { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public Role Role { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class AuthDbContext(DbContextOptions<AuthDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.Property(u => u.Name).HasMaxLength(120);
            e.Property(u => u.UniversityId).HasMaxLength(20);
            e.Property(u => u.Email).HasMaxLength(160);
            e.Property(u => u.PasswordHash).HasMaxLength(100);
            e.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.UniversityId).IsUnique();
        });
    }
}
