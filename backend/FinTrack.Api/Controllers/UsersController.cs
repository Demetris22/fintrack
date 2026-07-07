using System.Security.Cryptography;
using System.Text;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Users;
using FinTrack.Api.Models;
using FinTrack.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("users")]
public class UsersController : ControllerBase
{
    private readonly FinTrackDbContext _db;
    private readonly ITokenService _tokenService;

    public UsersController(FinTrackDbContext db, ITokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var fullName = string.IsNullOrWhiteSpace(request.FullName)
            ? null
            : request.FullName.Trim();

        var emailTaken = await _db.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (emailTaken)
            return Conflict(new { message = "A user with this email already exists." });

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = HashPassword(request.Password),
            FullName = fullName,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, ToResponse(user));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var hash = HashPassword(request.Password);
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail && u.PasswordHash == hash);
        if (user is null)
            return Unauthorized(new { message = "Invalid email or password." });

        var token = _tokenService.GenerateToken(user);

        return Ok(new LoginResponse { User = ToResponse(user), Token = token });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null)
            return NotFound();

        return Ok(ToResponse(user));
    }

    private static UserResponse ToResponse(User u) => new()
    {
        Id = u.Id,
        Email = u.Email,
        FullName = u.FullName,
        CreatedAt = u.CreatedAt,
    };

    // Placeholder hashing only — there is no authentication in this milestone.
    private static string HashPassword(string password)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
