using System.ComponentModel.DataAnnotations;

namespace FinTrack.Api.DTOs.Transactions;

public class CreateTransactionRequest
{
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }

    [Required]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be a 3-letter code.")]
    public string Currency { get; set; } = "EUR";

    [MaxLength(120)]
    public string? Merchant { get; set; }

    [Required]
    [MaxLength(80)]
    public string? Category { get; set; }

    [MaxLength(240)]
    public string? Description { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
    public decimal Amount { get; set; }

    [Required]
    [NoFutureDate]
    public DateOnly TransactionDate { get; set; }
}

public class NoFutureDateAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        if (value is DateOnly date && date > DateOnly.FromDateTime(DateTime.UtcNow))
            return new ValidationResult("Transaction date cannot be in the future.");

        return ValidationResult.Success;
    }
}
