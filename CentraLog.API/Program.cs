using System;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
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

var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
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

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:TokenKey"]!)),
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
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .SetIsOriginAllowed(origin => true)
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
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("CorsPolicy");

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

        // SAFE EXECUTION: Applies migrations without ever calling EnsureDeletedAsync()
        await context.Database.MigrateAsync();

        // Seed default system users safely if missing
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