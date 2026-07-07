using System.ComponentModel.DataAnnotations;

namespace FinTrack.Api.DTOs.Accounts;

public class CreateAccountRequest
{
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    [MaxLength(100)]
    public string? Institution { get; set; }

    [Required]
    [MaxLength(40)]
    public string AccountType { get; set; } = null!;

    [Required]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be a 3-letter code.")]
    public string Currency { get; set; } = "EUR";
}
