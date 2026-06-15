using FinTrack.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<FinTrackDbContext>(options =>
    options.UseNpgsql(connectionString));

var app = builder.Build();

// In Development, apply EF Core migrations automatically on startup so the
// schema is ready without a manual step. Never do this implicitly in Production.
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<FinTrackDbContext>();
        db.Database.Migrate();
    }

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();
