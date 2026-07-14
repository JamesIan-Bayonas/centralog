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

// Inject the Relational Database Context using Pomelo MySQL Configuration Engine
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// File path: CentraLog.API/Program.cs
// Insert this debug snippet right before builder.Services.AddDbContext to log configuration states:

var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
var initLogger = loggerFactory.CreateLogger("ProductionHandshakeDiagnostic");

var dbConnectionToVerify = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(dbConnectionToVerify) || dbConnectionToVerify.Contains("localhost"))
{
    initLogger.LogCritical("CRITICAL ARCHITECTURAL WARNING: Deployed environment is using a LOCALHOST database connection string mapping!");
}
else
{
    initLogger.LogInformation("Database connection string string parsed successfully. Target Host Node: {Host}",
        dbConnectionToVerify.Split(';').FirstOrDefault(x => x.StartsWith("Server", StringComparison.OrdinalIgnoreCase)));
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 30)),
        mySqlOptions => mySqlOptions
            .MigrationsAssembly("CentraLog.Infrastructure")
            // REPAIR ADDITION: Enables automated retry loops to bypass transient cloud database sleep drops safely
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

// CRITICAL: We must allow your future Vercel domain to bypass CORS walls!
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .WithOrigins(
                  "http://localhost:5173",
                  "http://localhost:3000",
                  "https://*.vercel.app" // ◄── Allows any deployment preview from Vercel to connect cleanly
              )
              .SetIsOriginAllowedToAllowWildcardSubdomains()
              .AllowCredentials();
    });
});

var app = builder.Build();

// =========================================================================
// 2. HTTP REQUEST PIPELINE CONIGURATION (MIDDLEWARE STACK)
// =========================================================================

app.UseMiddleware<GlobalExceptionMiddleware>();

// Put Swagger back at the root URL (/) for easy testing since there's no frontend here!
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
    //c.RoutePrefix = string.Empty; // ◄── Re-enabled: Root domain now shows documentation panels
});

app.UseHttpsRedirection();

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

// =========================================================================
// 3. DATABASE MIGRATION & SEEDING ENGINE DISPATCH (SAFE ENVIRONMENT LIFECYCLE)
// =========================================================================
using (var scope = app.Services.CreateScope())
{ 
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var env = services.GetRequiredService<IWebHostEnvironment>();

        if (env.IsDevelopment())
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("Development partition active: Wiping and recreating local relational database nodes...");

            // Only perform hard drops locally inside your XAMPP boundary sandbox
            await context.Database.EnsureDeletedAsync();
            await context.Database.MigrateAsync();
        }
        else
        {
            // SAFE CLOUD EXECUTION FOR MONSTERASP PRODUCTION TARGETS
            // Bypasses drops entirely and applies incremental scheme changes safely
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("Production cloud instance active: Applying structural schema updates incrementally...");
            await context.Database.MigrateAsync();
        }

        // Programmatically seeds default operators (admin_cl, manager_cl, staff_cl) safely if empty
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