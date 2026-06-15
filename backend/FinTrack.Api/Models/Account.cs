namespace FinTrack.Api.Models;

public class Account
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Institution { get; set; }
    public string AccountType { get; set; } = null!;
    public string Currency { get; set; } = "EUR";
    public DateTime CreatedAt { get; set; }

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
