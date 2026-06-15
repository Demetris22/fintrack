namespace FinTrack.Api.Models;

public class Transaction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid AccountId { get; set; }
    public Account Account { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public string? Merchant { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
    public DateOnly TransactionDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
