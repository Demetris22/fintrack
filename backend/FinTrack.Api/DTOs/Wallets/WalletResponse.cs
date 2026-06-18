namespace FinTrack.Api.DTOs.Wallets;

public class WalletResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Currency { get; set; } = null!;
    public decimal Balance { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
