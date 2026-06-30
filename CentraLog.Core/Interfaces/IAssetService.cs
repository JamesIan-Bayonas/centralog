using System.Threading;
using System.Threading.Tasks;
using CentraLog.Core.DTOs;

namespace CentraLog.Core.Interfaces;

public interface IAssetService
{
    Task<bool> ExecuteBulkTransferAsync(BulkTransferRequestDto dto, int adminUserId, CancellationToken cancellationToken);
}