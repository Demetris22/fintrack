using FinTrack.Api.Auth;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Ledger;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Authorize]
public class LedgerTransactionsController : ControllerBase
{
    private readonly FinTrackDbContext _db;

    public LedgerTransactionsController(FinTrackDbContext db) => _db = db;

    [HttpGet("wallets/{walletId:guid}/transactions")]
    public async Task<IActionResult> ListForWallet(Guid walletId)
    {
        var userId = User.GetUserId();

        var walletOwned = await _db.Wallets.AnyAsync(w => w.Id == walletId && w.UserId == userId);
        if (!walletOwned)
            return NotFound();

        var transactions = await _db.LedgerTransactions
            .Include(t => t.Postings)
            .Where(t => t.SourceWalletId == walletId || t.DestinationWalletId == walletId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(transactions.Select(ToResponse));
    }

    [HttpGet("ledger-transactions/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = User.GetUserId();

        var transaction = await _db.LedgerTransactions
            .Include(t => t.Postings)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction is null)
            return NotFound();

        var ownsSource = await _db.Wallets.AnyAsync(w => w.Id == transaction.SourceWalletId && w.UserId == userId);
        var ownsDestination = await _db.Wallets.AnyAsync(w => w.Id == transaction.DestinationWalletId && w.UserId == userId);
        if (!ownsSource && !ownsDestination)
            return NotFound();

        return Ok(ToResponse(transaction));
    }

    private static LedgerTransactionResponse ToResponse(LedgerTransaction t) => new()
    {
        Id = t.Id,
        Type = t.Type,
        Status = t.Status,
        Amount = t.AmountMinor / 100m,
        Currency = t.Currency,
        SourceWalletId = t.SourceWalletId,
        DestinationWalletId = t.DestinationWalletId,
        Description = t.Description,
        CreatedAt = t.CreatedAt,
        Postings = t.Postings.Select(p => new LedgerPostingResponse
        {
            WalletId = p.WalletId,
            Direction = p.Direction,
            Amount = p.AmountMinor / 100m,
            Currency = p.Currency,
        }).ToList(),
    };
}
