using System.ComponentModel.DataAnnotations;

namespace CentraLog.Core.DTOs
{
    public class ImportAssetRowDto
    {
        [Required(ErrorMessage = "Hardware asset name is required.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category classification is required.")]
        public string CategoryTag { get; set; } = string.Empty;

        [Range(1.00, 100_000_000.00, ErrorMessage = "Procurement cost must be between ₱1.00 and ₱100,000,000.00.")]
        public decimal ProcurementCost { get; set; }

        public int RoomId { get; set; }
        public int CustodianId { get; set; }
        public string? ImageUrl { get; set; }
    }
}