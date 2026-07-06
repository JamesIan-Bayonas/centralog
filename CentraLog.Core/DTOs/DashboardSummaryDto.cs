using System.Collections.Generic;

namespace CentraLog.Core.DTOs
{
    public class DashboardSummaryDto
    {
        public int TotalAssetCount { get; set; }
        public decimal TotalSystemValue { get; set; }
        public int ActiveCount { get; set; }
        public int InMaintenanceCount { get; set; }
        public int DisposedCount { get; set; }

        // Quick key-value pairing to render pie charts on the frontend easily
        public Dictionary<string, int> CategoryDistribution { get; set; } = new();
    }
}