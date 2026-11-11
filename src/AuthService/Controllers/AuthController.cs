using AuthService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Controllers;

public record RegisterRequest(string Name, string UniversityId, string Email, string Password, Role Role);
public record LoginRequest(string Email, string Password);
public record UserDto(int Id, string Name, string UniversityId, string Email, Role Role);

[ApiController]
[Route("api/auth")]
public class AuthController(AuthDbContext db) : ControllerBase
{
    // FR-U1
    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterRequest req)
    {
        if (req.Role == Role.Admin)
            return BadRequest("Admins cannot self-register.");

        if (await db.Users.AnyAsync(u => u.Email == req.Email || u.UniversityId == req.UniversityId))
            return Conflict("Email or university ID already registered.");

        var user = new User
        {
            Name = req.Name,
            UniversityId = req.UniversityId,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 11),
            Role = req.Role,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Register), ToDto(user));
    }

    // FR-U2 — TODO: issue a JWT here instead of returning the user only
    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginRequest req)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == req.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized();

        return ToDto(user);
    }

    private static UserDto ToDto(User u) => new(u.Id, u.Name, u.UniversityId, u.Email, u.Role);
}
