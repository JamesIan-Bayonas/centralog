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

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 30)),
        b => b.MigrationsAssembly("CentraLog.Infrastructure")
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
// 2. HTTP REQUEST PIPELINE CONFIGURATION (MIDDLEWARE STACK)
// =========================================================================

app.UseMiddleware<GlobalExceptionMiddleware>();

// Put Swagger back at the root URL (/) for easy testing since there's no frontend here!
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
    c.RoutePrefix = string.Empty; // ◄── Re-enabled: Root domain now shows documentation panels
});

app.UseHttpsRedirection();

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

// =========================================================================
// 3. DATABASE MIGRATION & SEEDING ENGINE DISPATCH
// =========================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
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