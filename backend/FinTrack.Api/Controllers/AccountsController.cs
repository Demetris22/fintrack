using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Accounts;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("accounts")]
public class AccountsController : ControllerBase
{
    private readonly FinTrackDbContext _db;

    public AccountsController(FinTrackDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccountRequest request)
    {
        var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId);
        if (!userExists)
            return BadRequest(new { message = "User not found." });

        var account = new Account
        {
            UserId = request.UserId,
            Name = request.Name,
            Institution = request.Institution,
            AccountType = request.AccountType,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "EUR" : request.Currency,
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = account.Id }, ToResponse(account));
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? userId)
    {
        var query = _db.Accounts.AsQueryable();
        if (userId.HasValue)
            query = query.Where(a => a.UserId == userId.Value);

        var accounts = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return Ok(accounts.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var account = await _db.Accounts.FindAsync(id);
        if (account is null)
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
