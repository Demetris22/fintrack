namespace FinTrack.Api.Models;

public class Budget
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Category { get; set; } = null!;
    public decimal MonthlyLimit { get; set; }
    public string Currency { get; set; } = "EUR";
    public DateTime CreatedAt { get; set; }
}
