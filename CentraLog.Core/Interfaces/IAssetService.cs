// CentraLog.Core/Interfaces/IAssetService.cs
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CentraLog.Core.DTOs;
using CentraLog.Core.Domain.Entities;

namespace CentraLog.Core.Interfaces
{
    public interface IAssetService
    {
        Task<PagedResult<Asset>> GetFilteredAssetsAsync(GetAssetsQueryFilterDto filter, CancellationToken cancellationToken = default);
        Task<AssetHistoryDto> GetAssetHistoryAsync(int assetId, CancellationToken cancellationToken = default);
        Task<bool> DisposeAssetAsync(int assetId, DisposeAssetCommandDto dto, int adminUserId, CancellationToken cancellationToken = default);
        Task<int> ImportAssetBatchAsync(IEnumerable<ImportAssetRowDto> items, CancellationToken cancellationToken = default);
        Task<bool> ResolveMaintenanceActionAsync(int assetId, MaintenanceActionRequestDto dto, int adminUserId, CancellationToken cancellationToken = default);
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default);
        Task<bool> InitiateMaintenanceAsync(int assetId, InitiateMaintenanceCommandDto dto, int adminUserId, CancellationToken cancellationToken = default);
        Task<Asset> GetAssetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<bool> ExecuteBulkTransferAsync(BulkTransferRequestDto dto, int adminUserId, CancellationToken cancellationToken = default);
        Task<DepreciationLedgerReportDto> GetDepreciationLedgerReportAsync(CancellationToken cancellationToken = default);

        // --- NEW PROPERTY OVERVIEW & STICKER QUEUE CONTRACTS ---
        Task<bool> UpdatePropertyAsync(int assetId, UpdatePropertyCommandDto dto, int adminUserId, CancellationToken cancellationToken = default);
        Task<bool> UpdateCustodianAssignmentAsync(int assetId, UpdateCustodianCommandDto dto, int adminUserId, CancellationToken cancellationToken = default);
        Task<bool> ToggleStickerQueueAsync(int assetId, CancellationToken cancellationToken = default);
        Task<List<Asset>> GetStickerQueueAsync(CancellationToken cancellationToken = default);
    }
}