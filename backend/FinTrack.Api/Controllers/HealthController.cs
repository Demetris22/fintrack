using FinTrack.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    private readonly FinTrackDbContext _db;

    public HealthController(FinTrackDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok" });

    [HttpGet("db")]
    public async Task<IActionResult> GetDatabaseHealth()
    {
        try
        {
            var canConnect = await _db.Database.CanConnectAsync();

            if (!canConnect)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    status = "unavailable",
                    database = "cannot_connect",
                });
            }

            var pendingMigrations = await _db.Database.GetPendingMigrationsAsync();

            return Ok(new
            {
                status = "ok",
                database = "connected",
                pendingMigrations = pendingMigrations.ToArray(),
            });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "unavailable",
                database = "error",
                error = ex.GetType().Name,
                message = ex.Message,
            });
        }
    }
}
