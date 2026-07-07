using FinTrack.Api.Auth;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Accounts;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Authorize]
[Route("accounts")]
public class AccountsController : ControllerBase
{
    private readonly FinTrackDbContext _db;

    public AccountsController(FinTrackDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccountRequest request)
    {
        var currentUserId = User.GetUserId();

        if (request.UserId != currentUserId)
            return Forbid();

        var userExists = await _db.Users.AnyAsync(u => u.Id == currentUserId);
        if (!userExists)
            return BadRequest(new { message = "User not found." });

        var account = new Account
        {
            UserId = currentUserId,
            Name = request.Name.Trim(),
            Institution = string.IsNullOrWhiteSpace(request.Institution) ? null : request.Institution.Trim(),
            AccountType = request.AccountType.Trim(),
            Currency = request.Currency.Trim().ToUpperInvariant(),
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = account.Id }, ToResponse(account));
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? userId)
    {
        var currentUserId = User.GetUserId();
        if (userId.HasValue && userId.Value != currentUserId)
            return Forbid();

        var query = _db.Accounts.AsQueryable();
        query = query.Where(a => a.UserId == currentUserId);

        var accounts = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return Ok(accounts.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var currentUserId = User.GetUserId();
        var account = await _db.Accounts.FindAsync(id);
        if (account is null)
            return NotFound();

        if (account.UserId != currentUserId)
            return NotFound();

        return Ok(ToResponse(account));
    }

    private static AccountResponse ToResponse(Account a) => new()
    {
        Id = a.Id,
        UserId = a.UserId,
        Name = a.Name,
        Institution = a.Institution,
        AccountType = a.AccountType,
        Currency = a.Currency,
        CreatedAt = a.CreatedAt,
    };
}
