using System;
using CentraLog.Core.Domain.Enums;

namespace CentraLog.Core.Domain.Entities
{
    public class Asset
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string CategoryTag { get; set; } = string.Empty;
        public decimal ProcurementCost { get; set; }
        public int RoomId { get; set; }
        public int CustodianId { get; set; }
        public LifecycleState LifecycleState { get; set; } = LifecycleState.Procured;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? NextServiceDate { get; set; }
        public bool IsMaintenanceFlagged { get; set; } = false;
        public int ExpectedLifespanMonths { get; set; } = 60;
        public DepreciationAlgorithm DepreciationMethod { get; set; } = DepreciationAlgorithm.StraightLine;
        public decimal SalvageValue { get; set; } = 0.00m;
    }
}