using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using CentraLog.Core.Domain.Enums;
using CentraLog.Infrastructure.Data;

namespace CentraLog.Infrastructure.BackgroundServices
{
    public class MaintenanceDaemonService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<MaintenanceDaemonService> _logger;

        // Configured to run its background inspection cycle once every 60 seconds
        private readonly TimeSpan _executionInterval = TimeSpan.FromSeconds(60);

        public MaintenanceDaemonService(IServiceScopeFactory scopeFactory, ILogger<MaintenanceDaemonService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Preventative Maintenance Daemon Engine successfully initialized and operational.");

            // Loop continuously until the application pool is completely stopped or recycled
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PerformInspectionSweepAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An unhandled error occurred during the preventative maintenance inspection loop.");
                }

                // Throttle execution loop to prevent CPU thread spikes
                await Task.Delay(_executionInterval, stoppingToken);
            }
        }

        private async Task PerformInspectionSweepAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Initializing periodic background inspection check across relational tables...");

            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var currentTime = DateTime.UtcNow;

            // 1. Overdue Preventative Maintenance Inspection
            var overdueAssets = await context.Assets
                .Where(a => a.NextServiceDate.HasValue
                         && a.NextServiceDate.Value <= currentTime
                         && !a.IsMaintenanceFlagged
                         && a.LifecycleState != LifecycleState.InMaintenance
                         && a.LifecycleState != LifecycleState.Disposed)
                .ToListAsync(cancellationToken);

            if (overdueAssets.Any())
            {
                _logger.LogWarning("Daemon detected {Count} hardware items breaching preventative maintenance thresholds! Triggering warning flags...", overdueAssets.Count);

                foreach (var asset in overdueAssets)
                {
                    asset.IsMaintenanceFlagged = true;
                    asset.UpdatedAt = currentTime;
                }

                await context.SaveChangesAsync(cancellationToken);
            }

            // 2. Ephemeral Sandbox Data Purge Sweep (Database Tier Protection)
            var expiredTemporaryAssets = await context.Assets
                .Where(a => a.IsTemporary && a.ExpiresAt.HasValue && a.ExpiresAt.Value <= currentTime)
                .ToListAsync(cancellationToken);

            if (expiredTemporaryAssets.Any())
            {
                _logger.LogWarning("Daemon detected {Count} expired temporary sandbox asset(s). Executing database storage purge...", expiredTemporaryAssets.Count);

                var expiredAssetIds = expiredTemporaryAssets.Select(a => a.Id).ToList();

                var orphanAuditLogs = await context.AuditLogs
                    .Where(l => expiredAssetIds.Contains(l.AssetId))
                    .ToListAsync(cancellationToken);

                var orphanMaintenanceLogs = await context.MaintenanceLogs
                    .Where(m => expiredAssetIds.Contains(m.AssetId))
                    .ToListAsync(cancellationToken);

                context.AuditLogs.RemoveRange(orphanAuditLogs);
                context.MaintenanceLogs.RemoveRange(orphanMaintenanceLogs);
                context.Assets.RemoveRange(expiredTemporaryAssets);

                await context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Purge sweep complete. Successfully freed database storage capacity.");
            }
        }
    }
}