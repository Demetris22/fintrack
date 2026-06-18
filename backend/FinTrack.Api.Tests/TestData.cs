using FinTrack.Api.Data;
using FinTrack.Api.Models;

namespace FinTrack.Api.Tests;

public static class TestData
{
    public static async Task<User> CreateUserAsync(FinTrackDbContext db)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"{Guid.NewGuid():N}@test.local",
            PasswordHash = "not-a-real-hash",
            FullName = "Test User",
            CreatedAt = DateTime.UtcNow,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return user;
    }

    public static async Task<Wallet> CreateWalletAsync(FinTrackDbContext db, Guid userId, string currency = "EUR", string status = "active", string? name = null)
    {
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name ?? $"{currency} Wallet",
            Currency = currency,
            BalanceMinor = 0,
            Status = status,
            IsSystem = false,
            CreatedAt = DateTime.UtcNow,
        };

        db.Wallets.Add(wallet);
        await db.SaveChangesAsync();

        return wallet;
    }
}
