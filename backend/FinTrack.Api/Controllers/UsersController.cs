using System.Security.Cryptography;
using System.Text;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Users;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("users")]
public class UsersController : ControllerBase
{
    private readonly FinTrackDbContext _db;

    public UsersController(FinTrackDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var emailTaken = await _db.Users.AnyAsync(u => u.Email == request.Email);
        if (emailTaken)
            return Conflict(new { message = "A user with this email already exists." });

        var user = new User
        {
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            FullName = request.FullName,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, ToResponse(user));
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
