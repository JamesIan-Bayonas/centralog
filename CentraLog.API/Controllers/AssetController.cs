using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CentraLog.Core.DTOs;
using CentraLog.Core.Interfaces;
using CentraLog.Core.Domain.Entities;

namespace CentraLog.API.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]s")]
    public class AssetController : ControllerBase
    {
        private readonly IAssetService _assetService;

        public AssetController(IAssetService assetService)
        {
            _assetService = assetService;
        }

        [HttpGet("search")]
        [ProducesResponseType(typeof(PagedResult<Asset>), StatusCodes.Status200OK)]
        public async Task<IActionResult> Search([FromQuery] GetAssetsQueryFilterDto filter, CancellationToken cancellationToken)
        {
            var result = await _assetService.GetFilteredAssetsAsync(filter, cancellationToken);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(Asset), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById([FromRoute] int id, CancellationToken cancellationToken)
        {
            try
            {
                var asset = await _assetService.GetAssetByIdAsync(id, cancellationToken);
                return Ok(asset);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("{id:int}/history")]
        [ProducesResponseType(typeof(AssetHistoryDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetHistory([FromRoute] int id, CancellationToken cancellationToken)
        {
            var history = await _assetService.GetAssetHistoryAsync(id, cancellationToken);
            return Ok(history);
        }

        [HttpGet("dashboard/summary")]
        [ProducesResponseType(typeof(DashboardSummaryDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDashboardSummary(CancellationToken cancellationToken)
        {
            var summary = await _assetService.GetDashboardSummaryAsync(cancellationToken);
            return Ok(summary);
        }

        [HttpPost("import")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> BulkImport([FromBody] IEnumerable<ImportAssetRowDto> items, CancellationToken cancellationToken)
        {
            try
            {
                var count = await _assetService.ImportAssetBatchAsync(items, cancellationToken);
                return Ok(new { recordsImported = count, message = "Procurement data matrix ingested successfully." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // =========================================================================
        // UC-05: EXECUTE BULK LOGISTICS RELOCATION (RBAC PROTECTED)
        // =========================================================================
        [HttpPost("bulk-transfer")]
        [Authorize(Roles = "Manager,SystemAdmin")] // Enforces Manager or Admin permission criteria
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> ExecuteBulkTransfer([FromBody] BulkTransferRequestDto dto, CancellationToken cancellationToken)
        {
            try
            {
                int adminUserId = GetCurrentUserId();
                await _assetService.ExecuteBulkTransferAsync(dto, adminUserId, cancellationToken);
                return Ok(new { message = "Grouped inventory assets successfully relocated across geographic bounds." }); // Success payload
            }
            catch (InvalidOperationException ex)
            {
                return UnprocessableEntity(new { message = ex.Message }); // Triggers alternative flow 6a
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Database transaction timeout. Relocation cancelled." }); // Alternative flow 7a
            }
        }

        // =========================================================================
        // UC-06: INITIATE PREVENTATIVE MAINTENANCE WORKFLOW (RBAC PROTECTED)
        // =========================================================================
        [HttpPatch("{id:int}/maintenance/initiate")]
        [Authorize(Roles = "InventoryStaff,SystemAdmin")] // Blocks unauthorized accounts with 403 Forbidden
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> InitiateMaintenance([FromRoute] int id, [FromBody] InitiateMaintenanceCommandDto dto, CancellationToken cancellationToken)
        {
            try
            {
                int adminUserId = GetCurrentUserId();
                await _assetService.InitiateMaintenanceAsync(id, dto, adminUserId, cancellationToken);
                return Ok(new { message = $"Asset with ID {id} has been successfully locked down and routed to active maintenance workflows." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // =========================================================================
        // UC-06: RESOLVE ACTIVE MAINTENANCE CALIBRATION WORKFLOW (RBAC PROTECTED)
        // =========================================================================
        [HttpPost("{id:int}/maintenance/resolve")]
        [Authorize(Roles = "InventoryStaff,SystemAdmin")] // Blocks unauthorized accounts with 403 Forbidden
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ResolveMaintenance([FromRoute] int id, [FromBody] MaintenanceActionRequestDto dto, CancellationToken cancellationToken)
        {
            try
            {
                int adminUserId = GetCurrentUserId();
                await _assetService.ResolveMaintenanceActionAsync(id, dto, adminUserId, cancellationToken);
                return Ok(new { message = $"Asset with ID {id} has been successfully extracted from repair loops." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            // Extracts the NameIdentifier claim written by TokenService
            var nameIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(nameIdClaim))
            {
                throw new UnauthorizedAccessException("Identity Verification Failed: Missing valid contextual authentication claims.");
            }
            return int.Parse(nameIdClaim);
        }

        // =========================================================================
        // FEATURE 6: PERMANENT ASSET DECOMMISSION & DISPOSAL
        // =========================================================================
        [HttpPost("{id:int}/dispose")]
        [Authorize(Roles = "Manager,SystemAdmin")] // Enforces System Admin / Manager disposal authority
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DisposeAsset([FromRoute] int id, [FromBody] DisposeAssetCommandDto dto, CancellationToken cancellationToken)
        {
            try
            {
                // Extract the verified System Admin / Manager ID from the JWT token claims passport
                var nameIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(nameIdClaim))
                {
                    return Unauthorized(new { message = "Identity Verification Failed: Missing valid contextual claims." });
                }
                int adminUserId = int.Parse(nameIdClaim);

                await _assetService.DisposeAssetAsync(id, dto, adminUserId, cancellationToken);
                return Ok(new { message = $"Asset with ID {id} has been permanently decommissioned and removed from active corporate capitalization registers." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}