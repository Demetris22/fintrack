using FinTrack.Api.Auth;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Analytics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Authorize]
[Route("analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly FinTrackDbContext _db;

    public AnalyticsController(FinTrackDbContext db) => _db = db;

    // GET /analytics/spending-by-category?userId=<uuid>
    // Returns total spending per transaction category for a single user.
    [HttpGet("spending-by-category")]
    public async Task<IActionResult> SpendingByCategory([FromQuery] Guid userId)
    {
        var currentUserId = User.GetUserId();
        if (userId != currentUserId)
            return Forbid();

        var breakdown = await _db.Transactions
            .Where(t => t.UserId == currentUserId)
            .GroupBy(t => t.Category)
            .Select(g => new CategorySpendingResponse
            {
                Category = g.Key,
                Total = g.Sum(t => t.Amount),
            })
            .OrderByDescending(x => x.Total)
            .ToListAsync();

        return Ok(new { userId = currentUserId, breakdown });
    }
}
