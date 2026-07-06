using System;

namespace CentraLog.Core.DTOs
{
    public class ImportAssetRowDto
    {
        public string Name { get; set; } = string.Empty;
        public string CategoryTag { get; set; } = string.Empty;
        public decimal ProcurementCost { get; set; }
        public int RoomId { get; set; }
        public int CustodianId { get; set; }
    }
}