using System.ComponentModel.DataAnnotations;

namespace FinTrack.Api.DTOs.Wallets;

public class CreateWalletRequest
{
    [Required]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be a 3-letter code.")]
    public string Currency { get; set; } = "EUR";

    [MaxLength(100)]
    public string? Name { get; set; }
}
