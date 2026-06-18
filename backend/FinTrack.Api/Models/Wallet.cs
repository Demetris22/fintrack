namespace FinTrack.Api.Models;

public class Wallet
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Currency { get; set; } = "EUR";
    public long BalanceMinor { get; set; }
    public string Status { get; set; } = "active";
    public bool IsSystem { get; set; }
    public DateTime CreatedAt { get; set; }
    public int Version { get; set; }

    public ICollection<LedgerTransaction> OutgoingTransactions { get; set; } = new List<LedgerTransaction>();
    public ICollection<LedgerTransaction> IncomingTransactions { get; set; } = new List<LedgerTransaction>();
    public ICollection<LedgerPosting> Postings { get; set; } = new List<LedgerPosting>();
}
