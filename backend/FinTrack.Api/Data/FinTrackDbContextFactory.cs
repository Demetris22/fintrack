using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace FinTrack.Api.Data;

// Used by the EF Core CLI (dotnet ef) at design time so that "migrations add"
// can construct the context without booting the full web host (which would
// otherwise try to connect to the database). No DB connection is made here.
public class FinTrackDbContextFactory : IDesignTimeDbContextFactory<FinTrackDbContext>
{
    public FinTrackDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=fintrack;Username=fintrack_user;Password=fintrack_password";

        var options = new DbContextOptionsBuilder<FinTrackDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new FinTrackDbContext(options);
    }
}
