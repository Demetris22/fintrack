namespace FinTrack.Api.DTOs.Transfers;

public class CreateTransferRequest
{
    public Guid SenderAccountId { get; set; }
    public Guid ReceiverAccountId { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
}