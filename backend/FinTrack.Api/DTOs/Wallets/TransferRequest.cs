using System.ComponentModel.DataAnnotations;

namespace FinTrack.Api.DTOs.Wallets;

public class TransferRequest
{
    public Guid SourceWalletId { get; set; }
    public Guid DestinationWalletId { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
    public decimal Amount { get; set; }

    [Required]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be a 3-letter code.")]
    public string Currency { get; set; } = null!;

    [MaxLength(240)]
    public string? Description { get; set; }
}
