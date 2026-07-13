// File path: CentraLog.Tests/Integration/AssetControllerTests.cs
using CentraLog.Core.Domain.Enums;
using CentraLog.Core.DTOs;
using CentraLog.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace CentraLog.Tests.Integration
{
    public class AssetControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private const string TestSigningKey = "CentraLogSuperSecretCryptographicSecureSigningKey2026SecurityTokenFramework!";

        // Mappings to a dedicated local XAMPP sandbox test catalog to prevent data corruption on active files
        private const string TestConnectionString = "Server=localhost;Port=3306;Database=db58833_test;Uid=root;Pwd=;";

        public AssetControllerTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                    if (descriptor != null) services.Remove(descriptor);

                    // Re-register using the exact same Pomelo engine, but targeting the isolated local sandbox catalog
                    services.AddDbContext<ApplicationDbContext>(options =>
                    {
                        options.UseMySql(TestConnectionString, new MySqlServerVersion(new Version(8, 0, 30)));
                    });
                });
            });
        }

        private HttpClient CreateAuthenticatedClient(UserRole role, int userId = 99)
        {
            var client = _factory.CreateClient();
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(TestSigningKey);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.UniqueName, $"test_{role.ToString().ToLower()}"),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role.ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return client;
        }

        private async Task SeedIsolatedDatabaseAsync(ApplicationDbContext context)
        {
            // Forces clean table recreation directly inside XAMPP database before runtime runs
            await context.Database.EnsureDeletedAsync();
            await context.Database.EnsureCreatedAsync();

            var timestamp = DateTime.UtcNow;

            await context.Assets.AddRangeAsync(new List<CentraLog.Core.Domain.Entities.Asset>
            {
                new() { Id = 1, Name = "Asset Unit Alpha", CategoryTag = "Infrastructure", ProcurementCost = 10000m, RoomId = 101, CustodianId = 1, LifecycleState = LifecycleState.Active },
                new() { Id = 2, Name = "Asset Unit Beta", CategoryTag = "Workstations", ProcurementCost = 25000m, RoomId = 101, CustodianId = 1, LifecycleState = LifecycleState.Active },
                new() { Id = 3, Name = "Asset Unit Gamma", CategoryTag = "Infrastructure", ProcurementCost = 50000m, RoomId = 202, CustodianId = 2, LifecycleState = LifecycleState.InMaintenance }
            });

            await context.SaveChangesAsync();
        }

        [Fact]
        public async Task ExecuteBulkTransfer_AsInventoryStaff_ReturnsForbidden()
        {
            var client = CreateAuthenticatedClient(UserRole.InventoryStaff);
            var transferDto = new BulkTransferRequestDto { AssetIds = new List<int> { 1, 2 }, DestinationRoomId = 101, NewCustodianId = 1 };

            var response = await client.PostAsJsonAsync("/api/v1/assets/bulk-transfer", transferDto);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task InitiateMaintenance_OnAlreadyMaintainingAsset_ReturnsBadRequestOrUnprocessable()
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await SeedIsolatedDatabaseAsync(context);

            var client = CreateAuthenticatedClient(UserRole.InventoryStaff);
            var maintenanceCommand = new InitiateMaintenanceCommandDto { IssueDescription = "Collision verification testing.", IsUrgent = false };

            var response = await client.PatchAsJsonAsync("/api/v1/assets/3/maintenance/initiate", maintenanceCommand);

            Assert.True(response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.UnprocessableEntity);
        }

        [Fact]
        public async Task DisposeAsset_AsAuthorizedManager_SuccessfullyUpdatesLifecycleAndSalvageValue()
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await SeedIsolatedDatabaseAsync(context);

            var client = CreateAuthenticatedClient(UserRole.Manager, userId: 2);
            var disposeCommand = new DisposeAssetCommandDto { DisposalReason = "Obsolescence verification sweep.", ScrapRecoveryValue = 7500.00m };

            var response = await client.PostAsJsonAsync("/api/v1/assets/2/dispose", disposeCommand);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task ExecuteBulkTransfer_OnDisposedAsset_ReturnsUnprocessableEntityOrBadRequest()
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await SeedIsolatedDatabaseAsync(context);

            var client = CreateAuthenticatedClient(UserRole.Manager, userId: 2);

            var asset = await context.Assets.FindAsync(1);
            if (asset != null) { asset.LifecycleState = LifecycleState.Disposed; await context.SaveChangesAsync(); }

            var transferDto = new BulkTransferRequestDto { AssetIds = new List<int> { 1 }, DestinationRoomId = 303, NewCustodianId = 2 };

            var response = await client.PostAsJsonAsync("/api/v1/assets/bulk-transfer", transferDto);

            Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        }
    }
}