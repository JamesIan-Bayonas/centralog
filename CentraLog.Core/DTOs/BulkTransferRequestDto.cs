using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CentraLog.Core.DTOs;

public record BulkTransferRequestDto
{
    [Required(ErrorMessage = "At least one target asset ID is required.")]
    public List<int> AssetIds { get; init; } = [];

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "A valid destination room ID is required.")]
    public int DestinationRoomId { get; init; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "A valid new handler custodian ID is required.")]
    public int NewCustodianId { get; init; }
}