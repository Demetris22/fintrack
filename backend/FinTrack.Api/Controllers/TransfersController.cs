using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Transfers;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("transfers")]
public class TransfersController : ControllerBase
{
    private readonly FinTrackDbContext _db;

    public TransfersController(FinTrackDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Transfer([FromBody] CreateTransferRequest request)
    {
        if (request.Amount <= 0)
            return BadRequest(new { message = "Amount must be greater than zero." });

        var senderAccount = await _db.Accounts.FindAsync(request.SenderAccountId);
        if (senderAccount is null)
            return BadRequest(new { message = "Sender account not found." });

        var receiverAccount = await _db.Accounts.FindAsync(request.ReceiverAccountId);
        if (receiverAccount is null)
            return BadRequest(new { message = "Receiver account not found." });

        if (senderAccount.Id == receiverAccount.Id)
            return BadRequest(new { message = "Cannot transfer to the same account." });

        // Υπολογισμός balance του sender
        var senderBalance = await _db.Transactions
            .Where(t => t.AccountId == senderAccount.Id)
            .SumAsync(t => t.Amount);

        if (senderBalance < request.Amount)
            return BadRequest(new { message = "Insufficient balance." });

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var description = request.Description ?? $"Transfer to {receiverAccount.Name}";

        // Debit sender (αρνητικό ποσό)
        var debit = new Transaction
        {
            UserId = senderAccount.UserId,
            AccountId = senderAccount.Id,
            Amount = -request.Amount,
            Currency = senderAccount.Currency,
            Category = "Transfer",
            Description = description,
            Merchant = receiverAccount.Name,
            TransactionDate = today
        };

        // Credit receiver (θετικό ποσό)
        var credit = new Transaction
        {
            UserId = receiverAccount.UserId,
            AccountId = receiverAccount.Id,
            Amount = request.Amount,
            Currency = receiverAccount.Currency,
            Category = "Transfer",
            Description = $"Transfer from {senderAccount.Name}",
            Merchant = senderAccount.Name,
            TransactionDate = today
        };

        _db.Transactions.Add(debit);
        _db.Transactions.Add(credit);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Transfer completed successfully.",
            senderAccountId = senderAccount.Id,
            receiverAccountId = receiverAccount.Id,
            amount = request.Amount,
            currency = senderAccount.Currency,
            date = today
        });
    }
}
