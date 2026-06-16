using System.ComponentModel.DataAnnotations;

namespace FinTrack.Api.DTOs.Transactions;

public class CreateTransactionRequest
{
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }
    public string Currency { get; set; } = "EUR";
    public string? Merchant { get; set; }
    public string? Category { get; set; }
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
