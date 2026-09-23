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
    }
}
