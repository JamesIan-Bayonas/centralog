using System.ComponentModel.DataAnnotations;
using CentraLog.Core.Domain.Enums;

namespace CentraLog.Core.DTOs
{
    public class MaintenanceActionRequestDto
    {
        [Required(ErrorMessage = "Resolution summary notes are required for corporate audit tracking.")]
        [StringLength(1000, ErrorMessage = "Resolution notes cannot exceed 1000 characters.")]
        public string ResolutionNotes { get; set; } = string.Empty;

        [Range(0.00, double.MaxValue, ErrorMessage = "Repair cost overhead variables cannot be a negative value.")]
        public decimal RepairCost { get; set; }

        [Required(ErrorMessage = "An explicit target lifecycle recovery state destination must be provided.")]
        public LifecycleState TargetState { get; set; } = LifecycleState.Active;
    }
}