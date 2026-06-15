namespace FinTrack.Api.DTOs.Accounts;

public class AccountResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string? Institution { get; set; }
    public string AccountType { get; set; } = null!;
    public string Currency { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
