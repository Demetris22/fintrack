using FinTrack.Api.Data;
using FinTrack.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Services;

public class WalletService : IWalletService
{
    private const string SystemUserEmail = "system@fintrack.internal";

    private readonly FinTrackDbContext _db;
    private readonly ILedgerService _ledgerService;

    public WalletService(FinTrackDbContext db, ILedgerService ledgerService)
    {
        _db = db;
        _ledgerService = ledgerService;
    }

    public async Task<Wallet> CreateWalletAsync(Guid userId, string currency, string name, CancellationToken cancellationToken = default)
    {
        currency = currency.ToUpperInvariant();

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name,
            Currency = currency,
            BalanceMinor = 0,
            Status = "active",
            IsSystem = false,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Wallets.Add(wallet);
        await _db.SaveChangesAsync(cancellationToken);

        return wallet;
    }

    public Task<List<Wallet>> GetWalletsForUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _db.Wallets.Where(w => w.UserId == userId).OrderBy(w => w.CreatedAt).ToListAsync(cancellationToken);

    public Task<Wallet?> GetWalletByIdAsync(Guid walletId, Guid userId, CancellationToken cancellationToken = default) =>
        _db.Wallets.FirstOrDefaultAsync(w => w.Id == walletId && w.UserId == userId, cancellationToken);

    public async Task<Dictionary<Guid, Wallet>> LockWalletsAsync(IEnumerable<Guid> walletIds, CancellationToken cancellationToken = default)
    {
        var orderedIds = walletIds.Distinct().OrderBy(id => id).ToList();
        var locked = new Dictionary<Guid, Wallet>();

        foreach (var id in orderedIds)
        {
            var wallet = await _db.Wallets
                .FromSqlInterpolated($"SELECT * FROM wallets WHERE \"Id\" = {id} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (wallet is null)
                throw new WalletNotFoundException(id);

            locked[id] = wallet;
        }

        return locked;
    }

    public async Task<LedgerTransaction> DepositAsync(Guid userId, Guid walletId, decimal amount, CancellationToken cancellationToken = default)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be greater than zero.", nameof(amount));

        var walletPreview = await _db.Wallets.AsNoTracking().FirstOrDefaultAsync(w => w.Id == walletId, cancellationToken)
            ?? throw new WalletNotFoundException(walletId);

        if (walletPreview.UserId != userId)
            throw new WalletOwnershipException(walletId);

        var currency = walletPreview.Currency;
        var amountMinor = MoneyMath.ToMinorUnits(amount);
        var systemWalletId = await GetOrCreateSystemWalletIdAsync(currency, cancellationToken);

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var locked = await LockWalletsAsync(new[] { walletId, systemWalletId }, cancellationToken);
            var targetWallet = locked[walletId];
            var systemWallet = locked[systemWalletId];

            if (targetWallet.UserId != userId)
                throw new WalletOwnershipException(walletId);

            if (targetWallet.Status != "active")
                throw new WalletNotActiveException(walletId);

            var ledgerTransaction = await _ledgerService.PostBalancedTransactionAsync(
                type: "deposit",
                initiatedByUserId: userId,
                sourceWalletId: systemWallet.Id,
                destinationWalletId: targetWallet.Id,
                amountMinor: amountMinor,
                currency: currency,
                description: "Simulated deposit",
                cancellationToken: cancellationToken);

            systemWallet.BalanceMinor -= amountMinor;
            systemWallet.Version++;
            targetWallet.BalanceMinor += amountMinor;
            targetWallet.Version++;

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

    private async Task<Guid> GetOrCreateSystemWalletIdAsync(string currency, CancellationToken cancellationToken)
    {
        var existingId = await _db.Wallets.AsNoTracking()
            .Where(w => w.IsSystem && w.Currency == currency)
            .Select(w => (Guid?)w.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingId.HasValue)
            return existingId.Value;

        var systemUserId = await _db.Users.AsNoTracking()
            .Where(u => u.Email == SystemUserEmail)
            .Select(u => (Guid?)u.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!systemUserId.HasValue)
        {
            var systemUser = new User
            {
                Id = Guid.NewGuid(),
                Email = SystemUserEmail,
                PasswordHash = Guid.NewGuid().ToString("N"),
                FullName = "FinTrack System",
                CreatedAt = DateTime.UtcNow,
            };

            _db.Users.Add(systemUser);
            await _db.SaveChangesAsync(cancellationToken);
            _db.Entry(systemUser).State = EntityState.Detached;
            systemUserId = systemUser.Id;
        }

        var systemWallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = systemUserId.Value,
            Name = $"System {currency}",
            Currency = currency,
            BalanceMinor = 0,
            Status = "active",
            IsSystem = true,
            CreatedAt = DateTime.UtcNow,
        };

        try
        {
            _db.Wallets.Add(systemWallet);
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            _db.Entry(systemWallet).State = EntityState.Detached;

            var raceId = await _db.Wallets.AsNoTracking()
                .Where(w => w.IsSystem && w.Currency == currency)
                .Select(w => (Guid?)w.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (raceId.HasValue)
                return raceId.Value;

            throw;
        }

        _db.Entry(systemWallet).State = EntityState.Detached;
        return systemWallet.Id;
    }

}
