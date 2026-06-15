namespace FinTrack.Api.DTOs.Accounts;

public class CreateAccountRequest
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string? Institution { get; set; }
    public string AccountType { get; set; } = null!;
    public string Currency { get; set; } = "EUR";
}
