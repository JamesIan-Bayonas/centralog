// CentraLog.Core/DTOs/UpdatePropertyCommandDto.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace CentraLog.Core.DTOs
{
    public class UpdatePropertyCommandDto
    {
        [Required(ErrorMessage = "Property name is required.")]
        public string Name { get; set; } = string.Empty;
        public string PropertyNumber { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public string AccountCategory { get; set; } = string.Empty;
        public string CategoryTag { get; set; } = string.Empty;
        public decimal ProcurementCost { get; set; }
        public DateTime AcquisitionDate { get; set; } = DateTime.UtcNow;
        public string Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }
}