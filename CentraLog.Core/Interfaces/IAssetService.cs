using System.Threading;
using System.Threading.Tasks;
using CentraLog.Core.DTOs;
using CentraLog.Core.Domain.Entities; // 👈 FIXED: Added '.Domain' here

namespace CentraLog.Core.Interfaces
{
    public interface IAssetService
    {
        // Restored your bulk transfer contract method

        // Our new filtering contract method
        Task<PagedResult<Asset>> GetFilteredAssetsAsync(GetAssetsQueryFilterDto filter, CancellationToken cancellationToken = default);

        Task<AssetHistoryDto> GetAssetHistoryAsync(int assetId, CancellationToken cancellationToken = default);

        Task<bool> DisposeAssetAsync(int assetId, DisposeAssetCommandDto dto, int adminUserId, CancellationToken cancellationToken = default);

        Task<int> ImportAssetBatchAsync(IEnumerable<ImportAssetRowDto> items, CancellationToken cancellationToken = default);

        Task<bool> ResolveMaintenanceActionAsync(int assetId, MaintenanceActionRequestDto dto, int adminUserId, CancellationToken cancellationToken = default);

        Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default);

        Task<bool> InitiateMaintenanceAsync(int assetId, InitiateMaintenanceCommandDto dto, int adminUserId, CancellationToken cancellationToken = default);
        
        Task<Asset> GetAssetByIdAsync(int id, CancellationToken cancellationToken = default);

        Task<bool> ExecuteBulkTransferAsync(BulkTransferRequestDto dto, int adminUserId, CancellationToken cancellationToken = default);
    }
}