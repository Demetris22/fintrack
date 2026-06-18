using FinTrack.Api.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FinTrack.Api.Tests;

[Collection("Postgres")]
public class WalletServiceTests
{
    private readonly PostgresFixture _fixture;

    public WalletServiceTests(PostgresFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task CreateWallet_Succeeds_WithZeroBalance()
    {
        using var db = _fixture.CreateDbContext();
        var ledgerService = new LedgerService(db);
        var walletService = new WalletService(db, ledgerService);

        var user = await TestData.CreateUserAsync(db);
        var wallet = await walletService.CreateWalletAsync(user.Id, "EUR");

        Assert.Equal(0, wallet.BalanceMinor);
        Assert.Equal("active", wallet.Status);
    }

    [Fact]
    public async Task CreateWallet_DuplicateCurrencyForSameUser_Throws()
    {
        using var db = _fixture.CreateDbContext();
        var ledgerService = new LedgerService(db);
        var walletService = new WalletService(db, ledgerService);

        var user = await TestData.CreateUserAsync(db);
        await walletService.CreateWalletAsync(user.Id, "EUR");

        await Assert.ThrowsAsync<WalletConflictException>(
            () => walletService.CreateWalletAsync(user.Id, "EUR"));
    }

    [Fact]
    public async Task Deposit_IncreasesBalance_AndCreatesBalancedPostings()
    {
        using var db = _fixture.CreateDbContext();
        var ledgerService = new LedgerService(db);
        var walletService = new WalletService(db, ledgerService);

        var user = await TestData.CreateUserAsync(db);
        var wallet = await TestData.CreateWalletAsync(db, user.Id, "EUR");

        var ledgerTransaction = await walletService.DepositAsync(user.Id, wallet.Id, 50m);

        using var verifyDb = _fixture.CreateDbContext();
        var updatedWallet = await verifyDb.Wallets.SingleAsync(w => w.Id == wallet.Id);
        Assert.Equal(5000, updatedWallet.BalanceMinor);

        var postings = await verifyDb.LedgerPostings
            .Where(p => p.LedgerTransactionId == ledgerTransaction.Id)
            .ToListAsync();

        Assert.Equal(2, postings.Count);
        var totalDebits = postings.Where(p => p.Direction == "debit").Sum(p => p.AmountMinor);
        var totalCredits = postings.Where(p => p.Direction == "credit").Sum(p => p.AmountMinor);
        Assert.Equal(totalDebits, totalCredits);
    }

    [Fact]
    public async Task Deposit_IntoFrozenWallet_Throws()
    {
        using var db = _fixture.CreateDbContext();
        var ledgerService = new LedgerService(db);
        var walletService = new WalletService(db, ledgerService);

        var user = await TestData.CreateUserAsync(db);
        var wallet = await TestData.CreateWalletAsync(db, user.Id, "EUR", status: "frozen");

        await Assert.ThrowsAsync<WalletNotActiveException>(
            () => walletService.DepositAsync(user.Id, wallet.Id, 10m));
    }

    [Fact]
    public async Task Deposit_NegativeAmount_Throws()
    {
        using var db = _fixture.CreateDbContext();
        var ledgerService = new LedgerService(db);
        var walletService = new WalletService(db, ledgerService);

        var user = await TestData.CreateUserAsync(db);
        var wallet = await TestData.CreateWalletAsync(db, user.Id, "EUR");

        await Assert.ThrowsAsync<ArgumentException>(
            () => walletService.DepositAsync(user.Id, wallet.Id, -10m));
    }

    [Fact]
    public async Task GetWalletById_ForAnotherUsersWallet_ReturnsNull()
    {
        using var db = _fixture.CreateDbContext();
        var ledgerService = new LedgerService(db);
        var walletService = new WalletService(db, ledgerService);

        var owner = await TestData.CreateUserAsync(db);
        var stranger = await TestData.CreateUserAsync(db);
        var wallet = await TestData.CreateWalletAsync(db, owner.Id, "EUR");

        var result = await walletService.GetWalletByIdAsync(wallet.Id, stranger.Id);

        Assert.Null(result);
    }

    [Fact]
    public async Task Deposit_IntoAnotherUsersWallet_ThrowsOwnership()
    {
        using var db = _fixture.CreateDbContext();
        var ledgerService = new LedgerService(db);
        var walletService = new WalletService(db, ledgerService);

        var owner = await TestData.CreateUserAsync(db);
        var stranger = await TestData.CreateUserAsync(db);
        var wallet = await TestData.CreateWalletAsync(db, owner.Id, "EUR");

        await Assert.ThrowsAsync<WalletOwnershipException>(
            () => walletService.DepositAsync(stranger.Id, wallet.Id, 10m));
    }

    [Fact]
    public async Task GetWalletsForUser_OnlyReturnsOwnWallets()
    {
        using var db = _fixture.CreateDbContext();
        var ledgerService = new LedgerService(db);
        var walletService = new WalletService(db, ledgerService);

        var userA = await TestData.CreateUserAsync(db);
        var userB = await TestData.CreateUserAsync(db);
        var walletA = await TestData.CreateWalletAsync(db, userA.Id, "EUR");
        await TestData.CreateWalletAsync(db, userB.Id, "EUR");

        var results = await walletService.GetWalletsForUserAsync(userA.Id);

        Assert.Single(results);
        Assert.Equal(walletA.Id, results[0].Id);
    }
}
