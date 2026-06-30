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

// Inject the Relational Database Context using an in-memory or connection string approach
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Server=(localdb)\\mssqllocaldb;Database=CentraLogDb;Trusted_Connection=True;MultipleActiveResultSets=true"));

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

app.MapControllers();

app.Run();