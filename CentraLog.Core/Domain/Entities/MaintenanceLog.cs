using System;

namespace CentraLog.Core.Domain.Entities;

public class MaintenanceLog
{
    public int Id { get; set; }
    public int AssetId { get; set; }
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
    public int PerformedByUserId { get; set; }
    public string ResolutionNotes { get; set; } = string.Empty;
    public decimal RepairCost { get; set; } = 0.00m;
}