using FinTrack.Api.Data;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;

namespace FinTrack.Api.Tests;

public class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:16")
        .WithDatabase("fintrack_test")
        .WithUsername("fintrack_test")
        .WithPassword("fintrack_test")
        .Build();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        using var db = CreateDbContext();
        await db.Database.MigrateAsync();
    }

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();

    public FinTrackDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<FinTrackDbContext>()
            .UseNpgsql(_container.GetConnectionString())
            .Options;

        return new FinTrackDbContext(options);
    }
}

[CollectionDefinition("Postgres")]
public class PostgresCollection : ICollectionFixture<PostgresFixture>
{
}
