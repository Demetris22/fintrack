using FinTrack.Api.Models;

namespace FinTrack.Api.Services;

public interface IWalletService
{
    Task<Wallet> CreateWalletAsync(Guid userId, string currency, string name, CancellationToken cancellationToken = default);
    Task<List<Wallet>> GetWalletsForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Wallet?> GetWalletByIdAsync(Guid walletId, Guid userId, CancellationToken cancellationToken = default);
    Task<LedgerTransaction> DepositAsync(Guid userId, Guid walletId, decimal amount, CancellationToken cancellationToken = default);

    // Locks the given wallets (FOR UPDATE) in a deterministic, deadlock-safe order.
    // Must be called inside an open DB transaction.
    Task<Dictionary<Guid, Wallet>> LockWalletsAsync(IEnumerable<Guid> walletIds, CancellationToken cancellationToken = default);
}
