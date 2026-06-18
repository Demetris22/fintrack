using FinTrack.Api.Auth;
using FinTrack.Api.DTOs.Ledger;
using FinTrack.Api.DTOs.Wallets;
using FinTrack.Api.Models;
using FinTrack.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinTrack.Api.Controllers;

[ApiController]
[Authorize]
[Route("wallets")]
public class WalletsController : ControllerBase
{
    private readonly IWalletService _walletService;
    private readonly ITransferService _transferService;

    public WalletsController(IWalletService walletService, ITransferService transferService)
    {
        _walletService = walletService;
        _transferService = transferService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWalletRequest request)
    {
        var name = string.IsNullOrWhiteSpace(request.Name)
            ? $"{request.Currency.ToUpperInvariant()} Wallet"
            : request.Name;

        var wallet = await _walletService.CreateWalletAsync(User.GetUserId(), request.Currency, name);
        return CreatedAtAction(nameof(GetById), new { id = wallet.Id }, ToResponse(wallet));
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var wallets = await _walletService.GetWalletsForUserAsync(User.GetUserId());
        return Ok(wallets.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var wallet = await _walletService.GetWalletByIdAsync(id, User.GetUserId());
        if (wallet is null)
            return NotFound();

        return Ok(ToResponse(wallet));
    }

    [HttpPost("{id:guid}/deposit")]
    public async Task<IActionResult> Deposit(Guid id, [FromBody] DepositRequest request)
    {
        try
        {
            var ledgerTransaction = await _walletService.DepositAsync(User.GetUserId(), id, request.Amount);
            return Ok(ToResponse(ledgerTransaction));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (WalletNotFoundException)
        {
            return NotFound();
        }
        catch (WalletOwnershipException)
        {
            return Forbid();
        }
        catch (WalletNotActiveException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] TransferRequest request)
    {
        try
        {
            var ledgerTransaction = await _transferService.TransferAsync(
                User.GetUserId(),
                request.SourceWalletId,
                request.DestinationWalletId,
                request.Amount,
                request.Currency,
                request.Description);

            return Ok(ToResponse(ledgerTransaction));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (WalletNotFoundException)
        {
            return NotFound();
        }
        catch (WalletOwnershipException)
        {
            return Forbid();
        }
        catch (WalletNotActiveException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
        catch (CurrencyMismatchException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
        catch (InsufficientFundsException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    private static WalletResponse ToResponse(Wallet w) => new()
    {
        Id = w.Id,
        UserId = w.UserId,
        Name = w.Name,
        Currency = w.Currency,
        Balance = w.BalanceMinor / 100m,
        Status = w.Status,
        CreatedAt = w.CreatedAt,
    };

    private static LedgerTransactionResponse ToResponse(LedgerTransaction t) => new()
    {
        Id = t.Id,
        Type = t.Type,
        Status = t.Status,
        Amount = t.AmountMinor / 100m,
        Currency = t.Currency,
        SourceWalletId = t.SourceWalletId,
        DestinationWalletId = t.DestinationWalletId,
        Description = t.Description,
        CreatedAt = t.CreatedAt,
        Postings = t.Postings.Select(p => new LedgerPostingResponse
        {
            WalletId = p.WalletId,
            Direction = p.Direction,
            Amount = p.AmountMinor / 100m,
            Currency = p.Currency,
        }).ToList(),
    };
}
