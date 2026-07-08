using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CentraLog.Core.DTOs
{
    public class BulkTransferRequestDto
    {
        [Required(ErrorMessage = "The batch selection array cannot be empty.")]
        public List<int> AssetIds { get; set; } = new();

        [Required(ErrorMessage = "Target destination location identifier is required.")]
        public int DestinationRoomId { get; set; }

        [Required(ErrorMessage = "A target custodian handler assignment is required.")]
        public int NewCustodianId { get; set; }
    }
}