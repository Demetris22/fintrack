using FinTrack.Api.Models;

namespace FinTrack.Api.Services;

public interface ILedgerService
{
    Task<LedgerTransaction> PostBalancedTransactionAsync(
        string type,
        Guid initiatedByUserId,
        Guid sourceWalletId,
        Guid destinationWalletId,
        long amountMinor,
        string currency,
        string? description,
        CancellationToken cancellationToken = default);
}
