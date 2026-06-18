using FinTrack.Api.Data;
using FinTrack.Api.Models;

namespace FinTrack.Api.Services;

// Writes a balanced debit/credit posting pair for a ledger transaction. Does NOT
// touch wallet balances — the caller applies balance deltas itself, inside the
// same DB transaction, after locking the wallet rows it needs.
public class LedgerService : ILedgerService
{
    private readonly FinTrackDbContext _db;

    public LedgerService(FinTrackDbContext db) => _db = db;

    public async Task<LedgerTransaction> PostBalancedTransactionAsync(
        string type,
        Guid initiatedByUserId,
        Guid sourceWalletId,
        Guid destinationWalletId,
        long amountMinor,
        string currency,
        string? description,
        CancellationToken cancellationToken = default)
    {
        if (amountMinor <= 0)
            throw new ArgumentException("Amount must be greater than zero.", nameof(amountMinor));

        var now = DateTime.UtcNow;

        var ledgerTransaction = new LedgerTransaction
        {
            Id = Guid.NewGuid(),
            Type = type,
            Status = "posted",
            Currency = currency,
            AmountMinor = amountMinor,
            InitiatedByUserId = initiatedByUserId,
            SourceWalletId = sourceWalletId,
            DestinationWalletId = destinationWalletId,
            Description = description,
            CreatedAt = now,
        };

        var postings = new[]
        {
            new LedgerPosting
            {
                Id = Guid.NewGuid(),
                LedgerTransactionId = ledgerTransaction.Id,
                WalletId = sourceWalletId,
                Direction = "debit",
                AmountMinor = amountMinor,
                Currency = currency,
                CreatedAt = now,
            },
            new LedgerPosting
            {
                Id = Guid.NewGuid(),
                LedgerTransactionId = ledgerTransaction.Id,
                WalletId = destinationWalletId,
                Direction = "credit",
                AmountMinor = amountMinor,
                Currency = currency,
                CreatedAt = now,
            },
        };

        var totalDebits = postings.Where(p => p.Direction == "debit").Sum(p => p.AmountMinor);
        var totalCredits = postings.Where(p => p.Direction == "credit").Sum(p => p.AmountMinor);
        if (totalDebits != totalCredits)
            throw new InvalidOperationException("Ledger postings are not balanced.");

        _db.LedgerTransactions.Add(ledgerTransaction);
        _db.LedgerPostings.AddRange(postings);

        await _db.SaveChangesAsync(cancellationToken);

        return ledgerTransaction;
    }
}
