using FinTrack.Api.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FinTrack.Api.Tests;

[Collection("Postgres")]
public class TransferServiceTests
{
    private readonly PostgresFixture _fixture;

    public TransferServiceTests(PostgresFixture fixture) => _fixture = fixture;

    private static (WalletService Wallets, TransferService Transfers) BuildServices(FinTrack.Api.Data.FinTrackDbContext db)
    {
        var ledgerService = new LedgerService(db);
        var walletService = new WalletService(db, ledgerService);
        var transferService = new TransferService(db, walletService, ledgerService);
        return (walletService, transferService);
    }

    [Fact]
    public async Task Transfer_Success_UpdatesBothBalancesAndStaysBalanced()
    {
        using var db = _fixture.CreateDbContext();
        var (wallets, transfers) = BuildServices(db);

        var sender = await TestData.CreateUserAsync(db);
        var receiver = await TestData.CreateUserAsync(db);
        var senderWallet = await TestData.CreateWalletAsync(db, sender.Id, "EUR");
        var receiverWallet = await TestData.CreateWalletAsync(db, receiver.Id, "EUR");

        await wallets.DepositAsync(sender.Id, senderWallet.Id, 100m);

        var ledgerTransaction = await transfers.TransferAsync(
            sender.Id, senderWallet.Id, receiverWallet.Id, 30m, "EUR", "test transfer");

        using var verifyDb = _fixture.CreateDbContext();
        var updatedSender = await verifyDb.Wallets.SingleAsync(w => w.Id == senderWallet.Id);
        var updatedReceiver = await verifyDb.Wallets.SingleAsync(w => w.Id == receiverWallet.Id);

        Assert.Equal(7000, updatedSender.BalanceMinor);
        Assert.Equal(3000, updatedReceiver.BalanceMinor);

        var postings = await verifyDb.LedgerPostings
            .Where(p => p.LedgerTransactionId == ledgerTransaction.Id)
            .ToListAsync();

        var totalDebits = postings.Where(p => p.Direction == "debit").Sum(p => p.AmountMinor);
        var totalCredits = postings.Where(p => p.Direction == "credit").Sum(p => p.AmountMinor);
        Assert.Equal(totalDebits, totalCredits);
    }

    [Fact]
    public async Task Transfer_InsufficientFunds_ThrowsAndWritesNoRows()
    {
        using var db = _fixture.CreateDbContext();
        var (wallets, transfers) = BuildServices(db);

        var sender = await TestData.CreateUserAsync(db);
        var receiver = await TestData.CreateUserAsync(db);
        var senderWallet = await TestData.CreateWalletAsync(db, sender.Id, "EUR");
        var receiverWallet = await TestData.CreateWalletAsync(db, receiver.Id, "EUR");

        await wallets.DepositAsync(sender.Id, senderWallet.Id, 10m);

        await Assert.ThrowsAsync<InsufficientFundsException>(
            () => transfers.TransferAsync(sender.Id, senderWallet.Id, receiverWallet.Id, 999m, "EUR", null));

        using var verifyDb = _fixture.CreateDbContext();
        var senderAfter = await verifyDb.Wallets.SingleAsync(w => w.Id == senderWallet.Id);
        Assert.Equal(1000, senderAfter.BalanceMinor);

        var transactionCount = await verifyDb.LedgerTransactions
            .CountAsync(t => t.SourceWalletId == senderWallet.Id && t.Type == "transfer");
        Assert.Equal(0, transactionCount);
    }

    [Fact]
    public async Task Transfer_FromSomeoneElsesWallet_Throws()
    {
        using var db = _fixture.CreateDbContext();
        var (wallets, transfers) = BuildServices(db);

        var owner = await TestData.CreateUserAsync(db);
        var attacker = await TestData.CreateUserAsync(db);
        var receiver = await TestData.CreateUserAsync(db);

        var ownerWallet = await TestData.CreateWalletAsync(db, owner.Id, "EUR");
        var receiverWallet = await TestData.CreateWalletAsync(db, receiver.Id, "EUR");
        await wallets.DepositAsync(owner.Id, ownerWallet.Id, 100m);

        await Assert.ThrowsAsync<WalletOwnershipException>(
            () => transfers.TransferAsync(attacker.Id, ownerWallet.Id, receiverWallet.Id, 10m, "EUR", null));
    }

    [Fact]
    public async Task Transfer_ToFrozenWallet_Throws()
    {
        using var db = _fixture.CreateDbContext();
        var (wallets, transfers) = BuildServices(db);

        var sender = await TestData.CreateUserAsync(db);
        var receiver = await TestData.CreateUserAsync(db);
        var senderWallet = await TestData.CreateWalletAsync(db, sender.Id, "EUR");
        var receiverWallet = await TestData.CreateWalletAsync(db, receiver.Id, "EUR", status: "frozen");
        await wallets.DepositAsync(sender.Id, senderWallet.Id, 100m);

        await Assert.ThrowsAsync<WalletNotActiveException>(
            () => transfers.TransferAsync(sender.Id, senderWallet.Id, receiverWallet.Id, 10m, "EUR", null));
    }

    [Fact]
    public async Task Transfer_CurrencyMismatch_Throws()
    {
        using var db = _fixture.CreateDbContext();
        var (wallets, transfers) = BuildServices(db);

        var sender = await TestData.CreateUserAsync(db);
        var receiver = await TestData.CreateUserAsync(db);
        var senderWallet = await TestData.CreateWalletAsync(db, sender.Id, "EUR");
        var receiverWallet = await TestData.CreateWalletAsync(db, receiver.Id, "USD");
        await wallets.DepositAsync(sender.Id, senderWallet.Id, 100m);

        await Assert.ThrowsAsync<CurrencyMismatchException>(
            () => transfers.TransferAsync(sender.Id, senderWallet.Id, receiverWallet.Id, 10m, "EUR", null));
    }

    [Fact]
    public async Task Transfer_ToSameWallet_Throws()
    {
        using var db = _fixture.CreateDbContext();
        var (wallets, transfers) = BuildServices(db);

        var user = await TestData.CreateUserAsync(db);
        var wallet = await TestData.CreateWalletAsync(db, user.Id, "EUR");
        await wallets.DepositAsync(user.Id, wallet.Id, 100m);

        await Assert.ThrowsAsync<ArgumentException>(
            () => transfers.TransferAsync(user.Id, wallet.Id, wallet.Id, 10m, "EUR", null));
    }

    [Fact]
    public async Task ConcurrentTransfers_CannotOverdraftSourceWallet()
    {
        using var setupDb = _fixture.CreateDbContext();
        var (setupWallets, _) = BuildServices(setupDb);

        var sender = await TestData.CreateUserAsync(setupDb);
        var senderWallet = await TestData.CreateWalletAsync(setupDb, sender.Id, "EUR");
        await setupWallets.DepositAsync(sender.Id, senderWallet.Id, 100m); // 100.00 EUR

        // 10 concurrent transfers of 20.00 each: only 5 can possibly succeed (5 * 20 = 100).
        const int attempts = 10;
        const decimal amountPerTransfer = 20m;

        var tasks = new List<Task<bool>>();
        for (var i = 0; i < attempts; i++)
        {
            tasks.Add(Task.Run(async () =>
            {
                using var db = _fixture.CreateDbContext();
                var (_, transfers) = BuildServices(db);

                using var receiverDb = _fixture.CreateDbContext();
                var receiver = await TestData.CreateUserAsync(receiverDb);
                var receiverWallet = await TestData.CreateWalletAsync(receiverDb, receiver.Id, "EUR");

                try
                {
                    await transfers.TransferAsync(sender.Id, senderWallet.Id, receiverWallet.Id, amountPerTransfer, "EUR", null);
                    return true;
                }
                catch (InsufficientFundsException)
                {
                    return false;
                }
            }));
        }

        var results = await Task.WhenAll(tasks);

        using var verifyDb = _fixture.CreateDbContext();
        var finalWallet = await verifyDb.Wallets.SingleAsync(w => w.Id == senderWallet.Id);

        Assert.Equal(5, results.Count(succeeded => succeeded));
        Assert.Equal(0, finalWallet.BalanceMinor);
        Assert.True(finalWallet.BalanceMinor >= 0, "Wallet balance must never go negative.");
    }
}
