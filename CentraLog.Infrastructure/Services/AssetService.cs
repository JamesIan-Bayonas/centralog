// File path: CentraLog.Infrastructure/Services/AssetService.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CentraLog.Core.Domain.Entities;
using CentraLog.Core.Domain.Enums;
using CentraLog.Core.DTOs;
using CentraLog.Core.Interfaces;
using CentraLog.Infrastructure.Data;
using CentraLog.Infrastructure.Services.Depreciation;

namespace CentraLog.Infrastructure.Services
{
    public class AssetService : IAssetService
    {
        private readonly ApplicationDbContext _context;

        public AssetService(ApplicationDbContext context)
        {
            _context = context;
        }

        public decimal CalculateDepreciatedValue(Asset asset, List<MaintenanceLog> logs)
        {
            IDepreciationStrategy strategy = asset.DepreciationMethod switch
            {
                DepreciationAlgorithm.DoubleDeclining => new DoubleDecliningStrategy(),
                DepreciationAlgorithm.StraightLine or _ => new StraightLineStrategy()
            };

            return strategy.CalculateBookValue(asset, logs, DateTime.UtcNow);
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default)
        {
            var assets = await _context.Assets.ToListAsync(cancellationToken);
            var allMaintenanceLogs = await _context.MaintenanceLogs.ToListAsync(cancellationToken);

            decimal totalDepreciatedSystemValue = 0.00m;

            foreach (var asset in assets)
            {
                totalDepreciatedSystemValue += CalculateDepreciatedValue(asset, allMaintenanceLogs);
            }

            return new DashboardSummaryDto
            {
                TotalAssetCount = assets.Count,
                TotalSystemValue = totalDepreciatedSystemValue,
                ActiveCount = assets.Count(a => a.LifecycleState == LifecycleState.Active),
                InMaintenanceCount = assets.Count(a => a.LifecycleState == LifecycleState.InMaintenance),
                DisposedCount = assets.Count(a => a.LifecycleState == LifecycleState.Disposed)
            };
        }

        public async Task<bool> ExecuteBulkTransferAsync(BulkTransferRequestDto dto, int adminUserId, CancellationToken cancellationToken = default)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var timestamp = DateTime.UtcNow;

                foreach (var assetId in dto.AssetIds)
                {
                    var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken);
                    if (asset == null) throw new KeyNotFoundException($"Transfer rejected: Asset {assetId} missing.");
                    if (asset.LifecycleState == LifecycleState.Disposed || asset.LifecycleState == LifecycleState.InMaintenance)
                    {
                        await transaction.RollbackAsync(cancellationToken);
                        throw new InvalidOperationException($"Transfer rejected: Asset {asset.Id} is un-relocatable.");
                    }

                    var auditLog = new AuditLog
                    {
                        AssetId = asset.Id,
                        OldRoomId = asset.RoomId,
                        NewRoomId = dto.DestinationRoomId,
                        OldCustodianId = asset.CustodianId,
                        NewCustodianId = dto.NewCustodianId,
                        ModifiedByUserId = adminUserId,
                        Timestamp = timestamp
                    };

                    asset.RoomId = dto.DestinationRoomId;
                    asset.CustodianId = dto.NewCustodianId;
                    asset.UpdatedAt = timestamp;

                    await _context.AuditLogs.AddAsync(auditLog, cancellationToken);
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return true;
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw new TimeoutException("Database deadlock encountered.");
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        public async Task<bool> InitiateMaintenanceAsync(int assetId, InitiateMaintenanceCommandDto dto, int adminUserId, CancellationToken cancellationToken = default)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken);
                if (asset == null) throw new KeyNotFoundException($"Asset {assetId} missing.");
                if (asset.LifecycleState == LifecycleState.InMaintenance || asset.LifecycleState == LifecycleState.Disposed)
                {
                    throw new InvalidOperationException("Asset cannot enter repairs.");
                }

                var timestamp = DateTime.UtcNow;
                var maintenanceLog = new MaintenanceLog
                {
                    AssetId = asset.Id,
                    StartTime = timestamp,
                    PerformedByUserId = adminUserId,
                    ResolutionNotes = dto.IssueDescription,
                    RepairCost = 0.00m
                };

                asset.LifecycleState = LifecycleState.InMaintenance;
                asset.IsMaintenanceFlagged = false;
                asset.UpdatedAt = timestamp;

                await _context.MaintenanceLogs.AddAsync(maintenanceLog, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        public async Task<bool> ResolveMaintenanceActionAsync(int assetId, MaintenanceActionRequestDto dto, int adminUserId, CancellationToken cancellationToken = default)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken);
                if (asset == null) throw new KeyNotFoundException($"Asset {assetId} missing.");

                var timestamp = DateTime.UtcNow;
                var activeLog = await _context.MaintenanceLogs
                    .Where(m => m.AssetId == assetId && m.EndTime == null)
                    .OrderByDescending(m => m.StartTime)
                    .FirstOrDefaultAsync(cancellationToken);

                if (activeLog != null)
                {
                    activeLog.EndTime = timestamp;
                    activeLog.ResolutionNotes = dto.ResolutionNotes;
                    activeLog.RepairCost = dto.RepairCost;
                    activeLog.PerformedByUserId = adminUserId;
                }

                asset.LifecycleState = LifecycleState.Active;
                asset.UpdatedAt = timestamp;

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        public async Task<bool> DisposeAssetAsync(int assetId, DisposeAssetCommandDto dto, int adminUserId, CancellationToken cancellationToken = default)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken);
                if (asset == null) throw new KeyNotFoundException($"Asset {assetId} does not exist.");
                if (asset.LifecycleState == LifecycleState.Disposed)
                {
                    throw new InvalidOperationException("Asset has already been decommissioned.");
                }

                var timestamp = DateTime.UtcNow;

                asset.LifecycleState = LifecycleState.Disposed;
                asset.SalvageValue = dto.ScrapRecoveryValue;
                asset.UpdatedAt = timestamp;

                var auditLog = new AuditLog
                {
                    AssetId = asset.Id,
                    OldRoomId = asset.RoomId,
                    NewRoomId = asset.RoomId,
                    OldCustodianId = asset.CustodianId,
                    NewCustodianId = asset.CustodianId,
                    ModifiedByUserId = adminUserId,
                    Timestamp = timestamp
                };

                await _context.AuditLogs.AddAsync(auditLog, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        public async Task<Asset> GetAssetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
            if (asset == null) throw new KeyNotFoundException($"Asset with ID {id} does not exist.");
            return asset;
        }

        public async Task<PagedResult<Asset>> GetFilteredAssetsAsync(GetAssetsQueryFilterDto filter, CancellationToken cancellationToken = default)
        {
            var query = _context.Assets.AsQueryable();
            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                query = query.Where(a => a.Name.Contains(filter.SearchTerm));
            }

            int totalCount = await query.CountAsync(cancellationToken);
            var items = await query.Skip((filter.PageNumber - 1) * filter.PageSize)
                                   .Take(filter.PageSize)
                                   .ToListAsync(cancellationToken);

            return new PagedResult<Asset>(items, totalCount, filter.PageNumber, filter.PageSize);
        }

        public async Task<int> ImportAssetBatchAsync(IEnumerable<ImportAssetRowDto> items, CancellationToken cancellationToken = default)
        {
            var timestamp = DateTime.UtcNow;
            var assetsToInsert = items.Select(row => new Asset
            {
                Name = row.Name,
                CategoryTag = row.CategoryTag,
                ProcurementCost = row.ProcurementCost,
                RoomId = row.RoomId,
                CustodianId = row.CustodianId,
                LifecycleState = LifecycleState.Procured,
                CreatedAt = timestamp,
                UpdatedAt = timestamp
            }).ToList();

            await _context.Assets.AddRangeAsync(assetsToInsert, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return assetsToInsert.Count;
        }

        // =========================================================================
        // FEATURE 9: REAL-TIME AUDIT LOG TRAIL PROJECTOR (ENRICHED PROJECTOR FEED)
        // =========================================================================
        public async Task<AssetHistoryDto> GetAssetHistoryAsync(int assetId, CancellationToken cancellationToken = default)
        {
            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken);
            if (asset == null)
            {
                throw new KeyNotFoundException($"History lookup rejected: Asset ID {assetId} does not exist in relational nodes.");
            }

            var rawLogs = await _context.AuditLogs
                .Where(log => log.AssetId == assetId)
                .OrderByDescending(log => log.Timestamp)
                .ToListAsync(cancellationToken);

            var enrichedEntries = new List<AuditLogTimelineEntryDto>();
            var allUsers = await _context.Users.ToDictionaryAsync(u => u.Id, u => u.Username, cancellationToken);

            foreach (var log in rawLogs)
            {
                string oldRoomName = log.OldRoomId == 101 ? "Room 101 (Admin Office)" :
                                     log.OldRoomId == 202 ? "Room 202 (Server Room)" :
                                     log.OldRoomId == 303 ? "Room 303 (Laboratory)" : $"Room #{log.OldRoomId}";

                string newRoomName = log.NewRoomId == 101 ? "Room 101 (Admin Office)" :
                                     log.NewRoomId == 202 ? "Room 202 (Server Room)" :
                                     log.NewRoomId == 303 ? "Room 303 (Laboratory)" : $"Room #{log.NewRoomId}";

                string oldCustodianName = log.OldCustodianId == 1 ? "Custodian #1 (Systems Lead)" :
                                          log.OldCustodianId == 2 ? "Custodian #2 (Network Admin)" : $"Handler #{log.OldCustodianId}";

                string newCustodianName = log.NewCustodianId == 1 ? "Custodian #1 (Systems Lead)" :
                                          log.NewCustodianId == 2 ? "Custodian #2 (Network Admin)" : $"Handler #{log.NewCustodianId}";

                allUsers.TryGetValue(log.ModifiedByUserId, out var operatorName);

                enrichedEntries.Add(new AuditLogTimelineEntryDto
                {
                    LogId = log.Id,
                    OldRoomId = log.OldRoomId,
                    OldRoomName = oldRoomName,
                    NewRoomId = log.NewRoomId,
                    NewRoomName = newRoomName,
                    OldCustodianId = log.OldCustodianId,
                    OldCustodianName = oldCustodianName,
                    NewCustodianId = log.NewCustodianId,
                    NewCustodianName = newCustodianName,
                    ModifiedByUserId = log.ModifiedByUserId,
                    OperatorUsername = operatorName ?? "System Automated Daemon",
                    Timestamp = log.Timestamp
                });
            }

            return new AssetHistoryDto
            {
                AssetId = asset.Id,
                AssetName = asset.Name,
                TimelineEntries = enrichedEntries
            };
        }
    }
}