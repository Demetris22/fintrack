using FinTrack.Api.Auth;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Budgets;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Authorize]
[Route("budgets")]
public class BudgetsController : ControllerBase
{
    private readonly FinTrackDbContext _db;

    public BudgetsController(FinTrackDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBudgetRequest request)
    {
        var currentUserId = User.GetUserId();

        if (request.UserId != currentUserId)
            return Forbid();

        var normalizedCategory = request.Category.Trim();
        var normalizedCurrency = request.Currency.Trim().ToUpperInvariant();

        var userExists = await _db.Users.AnyAsync(u => u.Id == currentUserId);
        if (!userExists)
            return BadRequest(new { message = "User not found." });

        var duplicate = await _db.Budgets
            .AnyAsync(b => b.UserId == currentUserId && b.Category.ToLower() == normalizedCategory.ToLower());
        if (duplicate)
            return Conflict(new { message = "A budget for this category already exists for the user." });

        var budget = new Budget
        {
            UserId = currentUserId,
            Category = normalizedCategory,
            MonthlyLimit = request.MonthlyLimit,
            Currency = normalizedCurrency,
        };

        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = budget.Id }, ToResponse(budget));
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? userId)
    {
        var currentUserId = User.GetUserId();
        if (userId.HasValue && userId.Value != currentUserId)
            return Forbid();

        var query = _db.Budgets.AsQueryable();
        query = query.Where(b => b.UserId == currentUserId);

        var budgets = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();
        return Ok(budgets.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var currentUserId = User.GetUserId();
        var budget = await _db.Budgets.FindAsync(id);
        if (budget is null)
            return NotFound();

        if (budget.UserId != currentUserId)
            return NotFound();

        return Ok(ToResponse(budget));
    }

    private static BudgetResponse ToResponse(Budget b) => new()
    {
        Id = b.Id,
        UserId = b.UserId,
        Category = b.Category,
        MonthlyLimit = b.MonthlyLimit,
        Currency = b.Currency,
        CreatedAt = b.CreatedAt,
    };
}
