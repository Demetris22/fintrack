namespace FinTrack.Api.DTOs.Budgets;

public class BudgetResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Category { get; set; } = null!;
    public decimal MonthlyLimit { get; set; }
    public string Currency { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
