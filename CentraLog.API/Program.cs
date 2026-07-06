using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 30)), // ◄── Bypasses live handshakes cleanly!
        b => b.MigrationsAssembly("CentraLog.Infrastructure")
    ));

// S-Tier Clean Architecture Binding: Map Interface to its concrete implementation layer
builder.Services.AddScoped<IAssetService, AssetService>();

// Configure CORS to allow our React frontend (typically running on port 5173 or 3000) to communicate with this API
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowCredentials();
    });
});

var app = builder.Build();

// =========================================================================
// 2. HTTP REQUEST PIPELINE CONFIGURATION (MIDDLEWARE STACK)
// =========================================================================

// S-Tier Defensive Exception Interception: Must sit at the very top of the stack to catch down-stream errors
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Activate the CORS policy boundary before mapping routes
app.UseCors("CorsPolicy");

app.UseAuthorization();

// =========================================================================
// 3. DATABASE SEEDING ENGINE DISPATCH
// =========================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        // Fire our custom seeding mechanism asynchronously
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