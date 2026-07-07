using System.ComponentModel.DataAnnotations;

namespace FinTrack.Api.DTOs.Wallets;

public class DepositRequest
{
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
    public decimal Amount { get; set; }
}
