using CentraLog.Core.Domain.Entities;
using CentraLog.Core.Domain.Enums;
using CentraLog.Infrastructure.Data;
using CentraLog.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

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
    }
}
