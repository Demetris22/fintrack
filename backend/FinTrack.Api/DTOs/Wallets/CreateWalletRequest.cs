namespace FinTrack.Api.DTOs.Wallets;

public class CreateWalletRequest
{
    public string Currency { get; set; } = "EUR";
    public string? Name { get; set; }
}
