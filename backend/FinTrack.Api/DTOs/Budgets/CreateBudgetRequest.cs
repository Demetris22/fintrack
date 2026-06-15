namespace FinTrack.Api.DTOs.Budgets;

public class CreateBudgetRequest
{
    public Guid UserId { get; set; }
    public string Category { get; set; } = null!;
    public decimal MonthlyLimit { get; set; }
    public string Currency { get; set; } = "EUR";
}
