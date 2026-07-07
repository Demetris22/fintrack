using FinTrack.Api.Data;
using FinTrack.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Services;

public class TransferService : ITransferService
{
    private readonly FinTrackDbContext _db;
    private readonly IWalletService _walletService;
    private readonly ILedgerService _ledgerService;

    public TransferService(FinTrackDbContext db, IWalletService walletService, ILedgerService ledgerService)
    {
        _db = db;
        _walletService = walletService;
        _ledgerService = ledgerService;
    }

    public async Task<LedgerTransaction> TransferAsync(
        Guid currentUserId,
        Guid sourceWalletId,
        Guid destinationWalletId,
        decimal amount,
        string currency,
        string? description,
        CancellationToken cancellationToken = default)
    {
        if (sourceWalletId == destinationWalletId)
            throw new ArgumentException("Cannot transfer to the same wallet.");

        if (amount <= 0)
            throw new ArgumentException("Amount must be greater than zero.", nameof(amount));

        currency = NormalizeCurrency(currency);
        description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        var amountMinor = MoneyMath.ToMinorUnits(amount);

        // Fail-fast checks against untracked reads, before paying the cost of a transaction.
        // These are advisory only — the authoritative checks happen below against the locked rows.
        var sourcePreview = await _db.Wallets.AsNoTracking().FirstOrDefaultAsync(w => w.Id == sourceWalletId, cancellationToken)
            ?? throw new WalletNotFoundException(sourceWalletId);

        if (sourcePreview.UserId != currentUserId)
            throw new WalletOwnershipException(sourceWalletId);

        var destinationPreview = await _db.Wallets.AsNoTracking().FirstOrDefaultAsync(w => w.Id == destinationWalletId, cancellationToken)
            ?? throw new WalletNotFoundException(destinationWalletId);

        ValidateWalletPair(sourcePreview, destinationPreview, currency);

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var locked = await _walletService.LockWalletsAsync(new[] { sourceWalletId, destinationWalletId }, cancellationToken);
            var source = locked[sourceWalletId];
            var destination = locked[destinationWalletId];

            if (source.UserId != currentUserId)
                throw new WalletOwnershipException(sourceWalletId);

            ValidateWalletPair(source, destination, currency);

            if (source.BalanceMinor < amountMinor)
                throw new InsufficientFundsException();

            var ledgerTransaction = await _ledgerService.PostBalancedTransactionAsync(
                type: "transfer",
                initiatedByUserId: currentUserId,
                sourceWalletId: source.Id,
                destinationWalletId: destination.Id,
                amountMinor: amountMinor,
                currency: currency,
                description: description,
                cancellationToken: cancellationToken);

            source.BalanceMinor -= amountMinor;
            source.Version++;
            destination.BalanceMinor += amountMinor;
            destination.Version++;

            await _db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return ledgerTransaction;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static void ValidateWalletPair(Wallet source, Wallet destination, string currency)
    {
        if (source.Status != "active")
            throw new WalletNotActiveException(source.Id);

        if (destination.Status != "active")
            throw new WalletNotActiveException(destination.Id);

        if (source.Currency != currency || destination.Currency != currency)
            throw new CurrencyMismatchException();
    }

    private static string NormalizeCurrency(string currency)
    {
        var normalizedCurrency = currency.Trim().ToUpperInvariant();

        if (normalizedCurrency.Length != 3 || normalizedCurrency.Any(character => !char.IsLetter(character)))
            throw new ArgumentException("Currency must be a 3-letter code.", nameof(currency));

        return normalizedCurrency;
    }
}
