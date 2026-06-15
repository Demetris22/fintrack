namespace FinTrack.Api.DTOs.Users;

public class UserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string? FullName { get; set; }
    public DateTime CreatedAt { get; set; }
}
