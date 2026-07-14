// File path: CentraLog.API/Controllers/AssetController.cs
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

        // =========================================================================
        // FEATURE 9: REAL-TIME AUDIT TRAIL TIMELINE ROUTE (CONSOLIDATED ENGINES)
        // =========================================================================
        [HttpGet("{id:int}/history")]
        [Authorize] 
        [ProducesResponseType(typeof(AssetHistoryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetHistory([FromRoute] int id, CancellationToken cancellationToken)
        {
            try
            {
                var history = await _assetService.GetAssetHistoryAsync(id, cancellationToken);
                return Ok(history);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
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

        [HttpPost("bulk-transfer")]
        [Authorize(Roles = "Manager,SystemAdmin")] 
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
                return Ok(new { message = "Grouped inventory assets successfully relocated across geographic bounds." });
            }
            catch (InvalidOperationException ex)
            {
                return UnprocessableEntity(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Database transaction timeout. Relocation cancelled." });
            }
        }

        [HttpPatch("{id:int}/maintenance/initiate")]
        [Authorize(Roles = "InventoryStaff,SystemAdmin")] 
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

        [HttpPost("{id:int}/dispose")]
        [Authorize(Roles = "Manager,SystemAdmin")] 
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DisposeAsset([FromRoute] int id, [FromBody] DisposeAssetCommandDto dto, CancellationToken cancellationToken)
        {
            try
            {
                int adminUserId = GetCurrentUserId();
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

        private int GetCurrentUserId()
        {
            var nameIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(nameIdClaim))
            {
                throw new UnauthorizedAccessException("Identity Verification Failed: Missing valid contextual authentication claims.");
            }
            return int.Parse(nameIdClaim);
        }

        // File path: CentraLog.API/Controllers/AssetController.cs
        // Append this route handler inside your existing AssetController class container:

        // =========================================================================
        // FEATURE 7: AUTOMATED TABULAR REPORT GENERATION (ACCOUNTANT GATEWAY)
        // =========================================================================
        [HttpGet("finance/ledger-report")]
        [Authorize(Roles = "Accountant,SystemAdmin")]
        [ProducesResponseType(typeof(DepreciationLedgerReportDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetDepreciationLedgerReport(CancellationToken cancellationToken)
        {
            var report = await _assetService.GetDepreciationLedgerReportAsync(cancellationToken);
            return Ok(report);
        }

        [HttpPost("{id:int}/maintenance/resolve")]
        [Authorize(Roles = "InventoryStaff,SystemAdmin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> ResolveMaintenance([FromRoute] int id, [FromBody] MaintenanceActionRequestDto dto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                int adminUserId = GetCurrentUserId();
                await _assetService.ResolveMaintenanceActionAsync(id, dto, adminUserId, cancellationToken);
                return Ok(new { message = $"Asset with ID {id} has been successfully extracted from repair loops and restored to active operations." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (TimeoutException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = $"An unhandled hardware engine fault occurred: {ex.Message}" });
            }
        }
    }
}