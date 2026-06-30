using System.Text;
using FinTrack.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);
var allowedFrontendOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    "http://localhost:5173",
    "http://localhost:5174",
    "https://fintrack-beige-eta.vercel.app",
    "https://fintrack-git-main-demetris1.vercel.app",
};

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"]!;
var jwtIssuer = jwtSection["Issuer"]!;
var jwtAudience = jwtSection["Audience"]!;

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<FinTrack.Api.Services.ITokenService, FinTrack.Api.Services.TokenService>();
builder.Services.AddScoped<FinTrack.Api.Services.ILedgerService, FinTrack.Api.Services.LedgerService>();
builder.Services.AddScoped<FinTrack.Api.Services.IWalletService, FinTrack.Api.Services.WalletService>();
builder.Services.AddScoped<FinTrack.Api.Services.ITransferService, FinTrack.Api.Services.TransferService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCors", policy =>
    {
        policy
            .SetIsOriginAllowed(IsAllowedFrontendOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<FinTrackDbContext>(options =>
    options.UseNpgsql(connectionString));

var app = builder.Build();

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

app.Use(async (context, next) =>
{
    var origin = context.Request.Headers.Origin.ToString();

    if (!IsAllowedFrontendOrigin(origin))
    {
        await next();
        return;
    }

    AddCorsHeaders(context, origin);

    if (HttpMethods.IsOptions(context.Request.Method))
    {
        var requestedHeaders = context.Request.Headers[HeaderNames.AccessControlRequestHeaders].ToString();

        context.Response.Headers[HeaderNames.AccessControlAllowMethods] =
            "GET,POST,PUT,PATCH,DELETE,OPTIONS";
        context.Response.Headers[HeaderNames.AccessControlAllowHeaders] =
            string.IsNullOrWhiteSpace(requestedHeaders)
                ? "authorization,content-type"
                : requestedHeaders;
        context.Response.StatusCode = StatusCodes.Status204NoContent;
        return;
    }

    await next();
});

app.UseCors("FrontendCors");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

bool IsAllowedFrontendOrigin(string? origin)
{
    if (string.IsNullOrWhiteSpace(origin))
    {
        return false;
    }

    if (allowedFrontendOrigins.Contains(origin))
    {
        return true;
    }

    return Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
        uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase) &&
        uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase);
}

static void AddCorsHeaders(HttpContext context, string origin)
{
    context.Response.Headers[HeaderNames.AccessControlAllowOrigin] = origin;
    context.Response.Headers[HeaderNames.Vary] = HeaderNames.Origin;
}
