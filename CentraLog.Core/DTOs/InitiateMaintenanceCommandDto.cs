using System.ComponentModel.DataAnnotations;

namespace CentraLog.Core.DTOs
{
    public class InitiateMaintenanceCommandDto
    {
        [Required(ErrorMessage = "A diagnostic issue description is mandatory to route hardware to repair loops.")]
        [StringLength(500, ErrorMessage = "The issue description cannot exceed 500 characters.")]
        public string IssueDescription { get; set; } = string.Empty;

        public bool IsUrgent { get; set; }
    }
}