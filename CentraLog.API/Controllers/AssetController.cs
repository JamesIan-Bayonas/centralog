using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CentraLog.Core.DTOs;
using CentraLog.Core.Interfaces;
using CentraLog.Core.Domain.Entities;

namespace CentraLog.API.Controllers;

[ApiController]
[Route("api/v1/assets")]
// Note: In production development, authorization policies [Authorize(Roles = "System Admin")] would sit here.
public class AssetController : ControllerBase
{
    private readonly IAssetService _assetService;

    public AssetController(IAssetService assetService)
    {
        _assetService = assetService;
    }

    [HttpPost("bulk-transfer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BulkTransfer([FromBody] BulkTransferRequestDto request, CancellationToken cancellationToken)
    {
        // Mocking an authenticated Admin/Manager Operator User ID (e.g., ID 101) for this session context
        int activeAdminId = 101;

        // Our global middleware automatically handles sorting and intercepting any thrown errors
        await _assetService.ExecuteBulkTransferAsync(request, activeAdminId, cancellationToken);

        return Ok(new { message = "Bulk asset tracking relocation initialized successfully." });
    }

    [HttpGet("search")]
    [ProducesResponseType(typeof(PagedResult<Asset>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetFilteredAssets([FromQuery] GetAssetsQueryFilterDto filter, CancellationToken cancellationToken)
    {
        // The [FromQuery] attribute binds parameters from the URL directly into our DTO
        var result = await _assetService.GetFilteredAssetsAsync(filter, cancellationToken);

        return Ok(result);
    }

    [HttpGet("{id:int}/history")]
    [ProducesResponseType(typeof(AssetHistoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAssetHistory([FromRoute] int id, CancellationToken cancellationToken)
    {
        try
        {
            // The [FromRoute] attribute binds the {id} directly from the URL path variable
            var history = await _assetService.GetAssetHistoryAsync(id, cancellationToken);
            return Ok(history);
        }
        catch (KeyNotFoundException ex)
        {
            // Safely catch missing database records and return a standard 404 response wrapper
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/dispose")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DisposeAsset([FromRoute] int id, [FromBody] DisposeAssetCommandDto dto, CancellationToken cancellationToken)
    {
        try
        {
            // Hardcoding an authenticated User ID context (e.g., 101) for auditing purposes until Auth is added
            int mockAdminUserId = 101;

            var success = await _assetService.DisposeAssetAsync(id, dto, mockAdminUserId, cancellationToken);

            return Ok(new { message = $"Asset with ID {id} has been successfully decommissioned and written off." });
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

    [HttpPost("import")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportAssets([FromBody] IEnumerable<ImportAssetRowDto> items, CancellationToken cancellationToken)
    {
        try
        {
            var totalImported = await _assetService.ImportAssetBatchAsync(items, cancellationToken);

            return Ok(new
            {
                message = "Bulk intake operation completed successfully.",
                recordsImported = totalImported
            });
        }
        catch (ArgumentException ex)
        {
            // Intercept validation or data health rule violations
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:int}/maintenance/resolve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveMaintenance([FromRoute] int id, [FromBody] MaintenanceActionRequestDto dto, CancellationToken cancellationToken)
    {
        try
        {
            // Mocking user context ID 101 for operational session audit logs until auth is attached
            int mockAdminUserId = 101;

            var success = await _assetService.ResolveMaintenanceActionAsync(id, dto, mockAdminUserId, cancellationToken);

            return Ok(new { message = $"Asset with ID {id} has been successfully extracted from repair loops and returned to inventory tracking status." });
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

    [HttpGet("dashboard/summary")]
    [ProducesResponseType(typeof(DashboardSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardSummary(CancellationToken cancellationToken)
    {
        // Fetches native MySQL calculated metrics instantly
        var summary = await _assetService.GetDashboardSummaryAsync(cancellationToken);

        return Ok(summary);
    }

    [HttpPost("{id:int}/maintenance/initiate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> InitiateMaintenance([FromRoute] int id, [FromBody] InitiateMaintenanceCommandDto dto, CancellationToken cancellationToken)
    {
        try
        {
            // Mock user contextual ID 101 for database auditing purposes
            int mockAdminUserId = 101;

            var success = await _assetService.InitiateMaintenanceAsync(id, dto, mockAdminUserId, cancellationToken);

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

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Asset), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAssetById([FromRoute] int id, CancellationToken cancellationToken)
    {
        try
        {
            var asset = await _assetService.GetAssetByIdAsync(id, cancellationToken);
            return Ok(asset);
        }
        catch (KeyNotFoundException ex)
        {
            // Intercept missing records and drop a clean 404 block wrapper
            return NotFound(new { message = ex.Message });
        }
    }
}