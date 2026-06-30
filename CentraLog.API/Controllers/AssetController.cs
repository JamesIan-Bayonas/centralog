using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CentraLog.Core.DTOs;
using CentraLog.Core.Interfaces;

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
}