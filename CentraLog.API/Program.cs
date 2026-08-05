using System;
using System.IO;
using System.Linq;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Logging;
using CentraLog.Core.Interfaces;
using CentraLog.Infrastructure.Data;
using CentraLog.Infrastructure.Services;
using CentraLog.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. SERVICES CONFIGURATION (DEPENDENCY INJECTION HUB)
// =========================================================================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var loggerFactory = LoggerFactory.Create(b => b.AddConsole());
var initLogger = loggerFactory.CreateLogger("ProductionHandshakeDiagnostic");

if (string.IsNullOrEmpty(connectionString) || connectionString.Contains("localhost"))
{
    initLogger.LogInformation("Development Database active: Connecting to local MySQL instance.");
}
else
{
    initLogger.LogWarning("Production Database active: Target Host Node: {Host}",
        connectionString.Split(';').FirstOrDefault(x => x.StartsWith("Server", StringComparison.OrdinalIgnoreCase)));
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 30)),
        mySqlOptions => mySqlOptions
            .MigrationsAssembly("CentraLog.Infrastructure")
            .EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null
            )
    ));

builder.Services.AddScoped<IAssetService, AssetService>();
builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddHostedService<CentraLog.Infrastructure.BackgroundServices.MaintenanceDaemonService>();

var tokenKey = builder.Configuration["JwtSettings:TokenKey"];
if (string.IsNullOrEmpty(tokenKey))
{
    throw new InvalidOperationException("Critical Security Cryptography Failure: JWT Token signing key is missing from appsettings configuration files.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allows dynamic origin matching for Vercel & Localhost
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// =========================================================================
// 2. HTTP REQUEST PIPELINE (MIDDLEWARE STACK)
// =========================================================================

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "CentraLog API v1");
});

app.UseCors("CorsPolicy");

// ENFORCE STATIC FILE SERVING FOR UPLOADED ASSET MEDIA
var rootPath = app.Environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
var uploadsFolder = Path.Combine(rootPath, "uploads");
if (!Directory.Exists(uploadsFolder))
{
    Directory.CreateDirectory(uploadsFolder);
}

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

// =========================================================================
// 3. SAFE DATABASE MIGRATION & SEEDING DISPATCH (ZERO DESTRUCTIVE DROPS)
// =========================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        logger.LogInformation("Applying structural schema updates incrementally...");

        await context.Database.MigrateAsync();
        await DatabaseSeeder.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing data seeding blocks.");
    }
}

app.MapControllers();

app.Run();

public partial class Program { }