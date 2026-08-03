// CentraLog.Core/DTOs/UpdateCustodianCommandDto.cs
using System.ComponentModel.DataAnnotations;

namespace CentraLog.Core.DTOs
{
    public class UpdateCustodianCommandDto
    {
        [Required(ErrorMessage = "Target custodian identifier is required.")]
        public int NewCustodianId { get; set; }

        [Required(ErrorMessage = "Target physical room location is required.")]
        public int NewRoomId { get; set; }
    }
}