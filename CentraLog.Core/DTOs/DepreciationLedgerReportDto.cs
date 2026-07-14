// File path: CentraLog.Core/DTOs/DepreciationLedgerReportDto.cs
using System;
using System.Collections.Generic;

namespace CentraLog.Core.DTOs
{
    public class DepreciationLedgerReportDto
    {
        public DateTime GeneratedAt { get; set; }
        public decimal TotalHistoricalCost { get; set; }
        public decimal TotalCurrentBookValue { get; set; }
        public List<LedgerAssetRowDto> Rows { get; set; } = new();
    }

    public class LedgerAssetRowDto
    {
        public int AssetId { get; set; }
        public string AssetName { get; set; } = string.Empty;
        public string CategoryTag { get; set; } = string.Empty;
        public string DepreciationMethod { get; set; } = string.Empty;
        public decimal HistoricalCost { get; set; }
        public decimal AccumulatedDepreciation { get; set; }
        public decimal CurrentBookValue { get; set; }
        public decimal SalvageValue { get; set; }
        public string CurrentStatus { get; set; } = string.Empty;
    }
}