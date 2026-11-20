using CentraLog.Core.Domain.Entities;
using CentraLog.Core.Domain.Enums;
using CentraLog.Core.DTOs;
using CentraLog.Infrastructure.Data;
using CentraLog.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Text.Json;

namespace CentraLog.Tests
{
    public class DashboardSummaryTests
    {
        [Fact]
        public async Task GetDashboardSummary_UsesRecordedProcurementValueAndRemainsStable()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            await using var context = new ApplicationDbContext(options);
            await context.Assets.AddRangeAsync(
                new Asset
                {
                    Name = "Depreciating workstation",
                    CategoryTag = "Workstations",
                    ProcurementCost = 65_000m,
                    SalvageValue = 6_500m,
                    ExpectedLifespanMonths = 60,
                    DepreciationMethod = DepreciationAlgorithm.DoubleDeclining,
                    CreatedAt = DateTime.UtcNow.AddYears(-1)
                },
                new Asset
                {
                    Name = "Network switch",
                    CategoryTag = "Infrastructure",
                    ProcurementCost = 18_500m,
                    SalvageValue = 1_850m,
                    ExpectedLifespanMonths = 48,
                    CreatedAt = DateTime.UtcNow.AddYears(-1)
                });
            await context.SaveChangesAsync();

            var service = new AssetService(context);

            var firstSummary = await service.GetDashboardSummaryAsync();
            var secondSummary = await service.GetDashboardSummaryAsync();

            Assert.Equal(83_500m, firstSummary.TotalSystemValue);
            Assert.Equal(firstSummary.TotalSystemValue, secondSummary.TotalSystemValue);
        }

        [Fact]
        public async Task GetDashboardSummary_SeparatesRepairAndUrgentAlertCounts()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            await using var context = new ApplicationDbContext(options);
            await context.Assets.AddRangeAsync(
                new Asset { Name = "Repair A", LifecycleState = LifecycleState.InMaintenance },
                new Asset { Name = "Urgent B", LifecycleState = LifecycleState.Active, IsMaintenanceFlagged = true },
                new Asset { Name = "Repair C", LifecycleState = LifecycleState.InMaintenance },
                new Asset { Name = "Active D", LifecycleState = LifecycleState.Active },
                new Asset
                {
                    Name = "Repair and urgent E",
                    LifecycleState = LifecycleState.InMaintenance,
                    IsMaintenanceFlagged = true
                });
            await context.SaveChangesAsync();

            var summary = await new AssetService(context).GetDashboardSummaryAsync();

            Assert.Equal(3, summary.InMaintenanceCount);
            Assert.Equal(2, summary.UrgentAlertCount);
        }

        [Fact]
        public async Task GetAuditLog_ReturnsTimestampedCustodianAndRoomChanges()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            await using var context = new ApplicationDbContext(options);
            await context.Assets.AddAsync(new Asset { Id = 28, Name = "Cisco Catalyst Switch", RoomId = 101, CustodianId = 1 });
            await context.Users.AddAsync(new User { Id = 7, Username = "admin_cl" });
            await context.AuditLogs.AddAsync(new AuditLog
            {
                AssetId = 28,
                OldRoomId = 101,
                NewRoomId = 202,
                OldCustodianId = 1,
                NewCustodianId = 2,
                ModifiedByUserId = 7,
                Timestamp = new DateTime(2026, 9, 24, 8, 30, 0, DateTimeKind.Utc),
                ChangeSummary = "Custodian handoff and room relocation"
            });
            await context.SaveChangesAsync();

            var entries = await new AssetService(context).GetAuditLogAsync();

            var entry = Assert.Single(entries);
            Assert.Equal("Cisco Catalyst Switch", entry.AssetName);
            Assert.Equal("admin_cl", entry.OperatorUsername);
            Assert.Equal("Room 101 (Admin Office)", entry.OldRoomName);
            Assert.Equal("Room 202 (Server Room)", entry.NewRoomName);
            Assert.Equal("Custodian handoff and room relocation", entry.ChangeSummary);
        }

        [Theory]
        [InlineData("Maintenance resolved", "Maintenance resolved")]
        [InlineData("  ", "Asset record changed")]
        public async Task GetAssetHistory_ReturnsTheRecordedAuditSummary(string recordedSummary, string expectedSummary)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            await using var context = new ApplicationDbContext(options);
            await context.Assets.AddAsync(new Asset { Id = 30, Name = "Printer Epson" });
            await context.AuditLogs.AddAsync(new AuditLog
            {
                AssetId = 30,
                OldRoomId = 101,
                NewRoomId = 101,
                OldCustodianId = 1,
                NewCustodianId = 1,
                Timestamp = new DateTime(2026, 11, 20, 8, 54, 18, DateTimeKind.Unspecified),
                ChangeSummary = recordedSummary
            });
            await context.SaveChangesAsync();

            var service = new AssetService(context);
            var auditEntry = Assert.Single(await service.GetAuditLogAsync());
            var history = await service.GetAssetHistoryAsync(30);
            var assetEntry = Assert.Single(history.TimelineEntries);

            Assert.Equal(auditEntry.LogId, assetEntry.LogId);
            Assert.Equal(auditEntry.Timestamp, assetEntry.Timestamp);
            Assert.Equal(DateTimeKind.Utc, auditEntry.Timestamp.Kind);
            Assert.Equal("\"2026-11-20T08:54:18Z\"", JsonSerializer.Serialize(assetEntry.Timestamp));
            Assert.Equal(expectedSummary, assetEntry.ChangeSummary);
            Assert.Equal(auditEntry.ChangeSummary, assetEntry.ChangeSummary);
        }

        [Fact]
        public async Task Maintenance_RecordsStartAndResolutionInBothHistoryViews()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            await using var context = new ApplicationDbContext(options);
            var asset = new Asset
            {
                Id = 30, Name = "Printer Epson", RoomId = 101, CustodianId = 1,
                LifecycleState = LifecycleState.Active, IsMaintenanceFlagged = true
            };
            context.Assets.Add(asset);
            await context.SaveChangesAsync();

            var service = new AssetService(context);
            var command = new InitiateMaintenanceCommandDto { IssueDescription = "Print alignment" };
            await service.InitiateMaintenanceAsync(asset.Id, command, 7);

            var started = Assert.Single((await service.GetAssetHistoryAsync(asset.Id)).TimelineEntries);
            var maintenance = Assert.Single(await context.MaintenanceLogs.ToListAsync());
            Assert.Equal("Maintenance started", started.ChangeSummary);
            Assert.Equal(maintenance.StartTime, started.Timestamp);
            Assert.Equal(7, started.ModifiedByUserId);
            Assert.Equal(asset.RoomId, started.OldRoomId);
            Assert.Equal(started.OldRoomId, started.NewRoomId);
            Assert.Equal(asset.CustodianId, started.OldCustodianId);
            Assert.Equal(started.OldCustodianId, started.NewCustodianId);
            Assert.Equal(LifecycleState.InMaintenance, asset.LifecycleState);
            Assert.False(asset.IsMaintenanceFlagged);

            await Assert.ThrowsAsync<InvalidOperationException>(() => service.InitiateMaintenanceAsync(asset.Id, command, 7));
            Assert.Single(await service.GetAuditLogAsync());

            await service.ResolveMaintenanceActionAsync(asset.Id, new MaintenanceActionRequestDto
            {
                TargetState = LifecycleState.Active,
                ResolutionNotes = "Alignment corrected"
            }, 8);

            var history = (await service.GetAssetHistoryAsync(asset.Id)).TimelineEntries.OrderBy(entry => entry.LogId).ToArray();
            var audit = (await service.GetAuditLogAsync()).OrderBy(entry => entry.LogId).ToArray();
            Assert.Equal(new[] { "Maintenance started", "Maintenance resolved" }, history.Select(entry => entry.ChangeSummary));
            Assert.Equal(history.Select(entry => (entry.LogId, entry.ChangeSummary, entry.Timestamp)),
                audit.Select(entry => (entry.LogId, entry.ChangeSummary, entry.Timestamp)));
            Assert.Equal(maintenance.EndTime!.Value, history[1].Timestamp);
            Assert.Equal(8, history[1].ModifiedByUserId);
            Assert.Equal(LifecycleState.Active, asset.LifecycleState);
        }
    }
}
