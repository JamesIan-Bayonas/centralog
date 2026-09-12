using System;
using System.ComponentModel.DataAnnotations;

namespace CentraLog.Core.DTOs
{
    public class UpdatePropertyCommandDto
    {
        [Required(ErrorMessage = "Property name is required.")]
        public string Name { get; set; } = string.Empty;
        public string? PropertyNumber { get; set; } = string.Empty;
        public string? SerialNumber { get; set; } = string.Empty;
        public string? AccountCategory { get; set; } = string.Empty;
        public string? CategoryTag { get; set; } = string.Empty;

        [Range(0.00, 100_000_000.00, ErrorMessage = "Procurement cost must be between ₱0.00 and ₱100,000,000.00.")]
        public decimal ProcurementCost { get; set; }
        public DateTime? AcquisitionDate { get; set; } = DateTime.UtcNow;
        public string? Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }

    }
}