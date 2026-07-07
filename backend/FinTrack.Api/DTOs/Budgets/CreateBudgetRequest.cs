using System.ComponentModel.DataAnnotations;

namespace FinTrack.Api.DTOs.Budgets;

public class CreateBudgetRequest
{
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(80)]
    public string Category { get; set; } = null!;

    [Range(0.01, double.MaxValue, ErrorMessage = "Monthly limit must be greater than zero.")]
    public decimal MonthlyLimit { get; set; }

    [Required]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be a 3-letter code.")]
    public string Currency { get; set; } = "EUR";
}
