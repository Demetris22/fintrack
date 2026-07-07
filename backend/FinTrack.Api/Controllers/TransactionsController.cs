using FinTrack.Api.Auth;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Transactions;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Authorize]
[Route("transactions")]
public class TransactionsController : ControllerBase
{
    private readonly FinTrackDbContext _db;

    public TransactionsController(FinTrackDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransactionRequest request)
    {
        var currentUserId = User.GetUserId();

        if (request.UserId != currentUserId)
            return Forbid();

        var userExists = await _db.Users.AnyAsync(u => u.Id == currentUserId);
        if (!userExists)
            return BadRequest(new { message = "User not found." });

        var account = await _db.Accounts.FindAsync(request.AccountId);
        if (account is null)
            return BadRequest(new { message = "Account not found." });

        if (account.UserId != currentUserId)
            return BadRequest(new { message = "Account does not belong to the specified user." });

        var transaction = new Transaction
        {
            UserId = currentUserId,
            AccountId = request.AccountId,
            Amount = request.Amount,
            Currency = request.Currency.Trim().ToUpperInvariant(),
            Merchant = string.IsNullOrWhiteSpace(request.Merchant) ? null : request.Merchant.Trim(),
            Category = request.Category?.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            TransactionDate = request.TransactionDate,
        };

        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, ToResponse(transaction));
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? userId, [FromQuery] Guid? accountId)
    {
        var currentUserId = User.GetUserId();
        if (userId.HasValue && userId.Value != currentUserId)
            return Forbid();

        var query = _db.Transactions.AsQueryable();
        query = query.Where(t => t.UserId == currentUserId);
        if (accountId.HasValue)
            query = query.Where(t => t.AccountId == accountId.Value);

        var transactions = await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(transactions.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var currentUserId = User.GetUserId();
        var transaction = await _db.Transactions.FindAsync(id);
        if (transaction is null)
            return NotFound();

        if (transaction.UserId != currentUserId)
            return NotFound();

        return Ok(ToResponse(transaction));
    }

    private static TransactionResponse ToResponse(Transaction t) => new()
    {
        Id = t.Id,
        UserId = t.UserId,
        AccountId = t.AccountId,
        Amount = t.Amount,
        Currency = t.Currency,
        Merchant = t.Merchant,
        Category = t.Category,
        Description = t.Description,
        TransactionDate = t.TransactionDate,
        CreatedAt = t.CreatedAt,
    };
}
