using System.ComponentModel.DataAnnotations;

namespace FinTrack.Api.DTOs.Users;

public class CreateUserRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
    public string Password { get; set; } = null!;

    [MaxLength(120)]
    public string? FullName { get; set; }
}
