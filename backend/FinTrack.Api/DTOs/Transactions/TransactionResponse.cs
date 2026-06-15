namespace FinTrack.Api.DTOs.Transactions;

public class TransactionResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = null!;
    public string? Merchant { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
    public DateOnly TransactionDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
