namespace FinTrack.Api.DTOs.Transactions;

public class CreateTransactionRequest
{
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public string? Merchant { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
    public DateOnly TransactionDate { get; set; }
}
