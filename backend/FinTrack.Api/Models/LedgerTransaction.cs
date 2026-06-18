namespace FinTrack.Api.Models;

public class LedgerTransaction
{
    public Guid Id { get; set; }
    public string Type { get; set; } = null!;
    public string Status { get; set; } = "posted";
    public string Currency { get; set; } = "EUR";
    public long AmountMinor { get; set; }
    public Guid InitiatedByUserId { get; set; }
    public Guid SourceWalletId { get; set; }
    public Wallet SourceWallet { get; set; } = null!;
    public Guid DestinationWalletId { get; set; }
    public Wallet DestinationWallet { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<LedgerPosting> Postings { get; set; } = new List<LedgerPosting>();
}
