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

namespace CentraLog.Infrastructure.Services;

public class AssetService : IAssetService
{
    private readonly ApplicationDbContext _context;

    public AssetService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ExecuteBulkTransferAsync(BulkTransferRequestDto dto, int adminUserId, CancellationToken cancellationToken)
    {
        // Enforce strict transaction boundaries for database idempotency
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // Fetch target assets checking runtime scope bounds
            var assets = await _context.Assets
                .Where(a => dto.AssetIds.Contains(a.Id))
                .ToListAsync(cancellationToken);

            if (assets.Count != dto.AssetIds.Count)
                throw new KeyNotFoundException("One or more provided asset IDs could not be found in the system mapping database.");

            var timestamp = DateTime.UtcNow;

            foreach (var asset in assets)
            {
                // S-Tier Defensive Check: Guard against invalid immutable lifecycle states
                if (asset.LifecycleState == LifecycleState.Disposed || asset.LifecycleState == LifecycleState.InMaintenance)
                {
                    throw new InvalidOperationException($"Transfer rejected: Asset with ID {asset.Id} is currently in an unmodifiable state ({asset.LifecycleState}).");
                }

                // Stage compliance audit log entry tracking historical alterations
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

                // Execute data mutations to the localized domain entity instances
                asset.RoomId = dto.DestinationRoomId;
                asset.CustodianId = dto.NewCustodianId;
                asset.UpdatedAt = timestamp;

                await _context.AuditLogs.AddAsync(auditLog, cancellationToken);
            }

            // Commit transaction mutations atomically to persistent disk
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return true;
        }
        catch (Exception)
        {
            // Defensive rollback guarantees data integrity across timeouts or system errors
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}