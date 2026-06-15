using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Transactions;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("transactions")]
public class TransactionsController : ControllerBase
{
    private readonly FinTrackDbContext _db;

    public TransactionsController(FinTrackDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransactionRequest request)
    {
        var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId);
        if (!userExists)
            return BadRequest(new { message = "User not found." });

        var account = await _db.Accounts.FindAsync(request.AccountId);
        if (account is null)
            return BadRequest(new { message = "Account not found." });

        if (account.UserId != request.UserId)
            return BadRequest(new { message = "Account does not belong to the specified user." });

        var transaction = new Transaction
        {
            UserId = request.UserId,
            AccountId = request.AccountId,
            Amount = request.Amount,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "EUR" : request.Currency,
            Merchant = request.Merchant,
            Category = request.Category,
            Description = request.Description,
            TransactionDate = request.TransactionDate,
        };

        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, ToResponse(transaction));
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? userId, [FromQuery] Guid? accountId)
    {
        var query = _db.Transactions.AsQueryable();
        if (userId.HasValue)
            query = query.Where(t => t.UserId == userId.Value);
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
        var transaction = await _db.Transactions.FindAsync(id);
        if (transaction is null)
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
