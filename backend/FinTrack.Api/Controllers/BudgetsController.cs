using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Budgets;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("budgets")]
public class BudgetsController : ControllerBase
{
    private readonly FinTrackDbContext _db;

    public BudgetsController(FinTrackDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBudgetRequest request)
    {
        var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId);
        if (!userExists)
            return BadRequest(new { message = "User not found." });

        var duplicate = await _db.Budgets
            .AnyAsync(b => b.UserId == request.UserId && b.Category == request.Category);
        if (duplicate)
            return Conflict(new { message = "A budget for this category already exists for the user." });

        var budget = new Budget
        {
            UserId = request.UserId,
            Category = request.Category,
            MonthlyLimit = request.MonthlyLimit,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "EUR" : request.Currency,
        };

        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = budget.Id }, ToResponse(budget));
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? userId)
    {
        var query = _db.Budgets.AsQueryable();
        if (userId.HasValue)
            query = query.Where(b => b.UserId == userId.Value);

        var budgets = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();
        return Ok(budgets.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var budget = await _db.Budgets.FindAsync(id);
        if (budget is null)
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
