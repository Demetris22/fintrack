namespace FinTrack.Api.Models;

public class LedgerPosting
{
    public Guid Id { get; set; }
    public Guid LedgerTransactionId { get; set; }
    public LedgerTransaction LedgerTransaction { get; set; } = null!;
    public Guid WalletId { get; set; }
    public Wallet Wallet { get; set; } = null!;
    public string Direction { get; set; } = null!;
    public long AmountMinor { get; set; }
    public string Currency { get; set; } = "EUR";
    public DateTime CreatedAt { get; set; }
}
