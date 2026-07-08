using System;
using System.Collections.Generic;
using System.Linq;
using CentraLog.Core.Domain.Entities;
using CentraLog.Core.Interfaces;

namespace CentraLog.Infrastructure.Services.Depreciation
{
    public class StraightLineStrategy : IDepreciationStrategy
    {
        public decimal CalculateBookValue(Asset asset, List<MaintenanceLog> logs, DateTime evaluationTime)
        {
            if (asset.ProcurementCost <= asset.SalvageValue || asset.ExpectedLifespanMonths <= 0)
                return asset.ProcurementCost;

            double totalDaysElapsed = (evaluationTime - asset.CreatedAt).TotalDays;
            if (totalDaysElapsed <= 0) return asset.ProcurementCost;

            double maintenanceDays = 0;
            var assetLogs = logs.Where(l => l.AssetId == asset.Id);
            foreach (var log in assetLogs)
            {
                var endPoint = log.EndTime ?? evaluationTime;
                maintenanceDays += (endPoint - log.StartTime).TotalDays;
            }

            double activeDays = Math.Max(0, totalDaysElapsed - maintenanceDays);
            decimal activeMonths = (decimal)(activeDays / 30.4375);

            decimal depreciableAmount = asset.ProcurementCost - asset.SalvageValue;
            decimal monthlyDepreciationRate = depreciableAmount / asset.ExpectedLifespanMonths;
            decimal accumulatedDepreciation = monthlyDepreciationRate * activeMonths;

            decimal calculatedValue = asset.ProcurementCost - accumulatedDepreciation;
            return Math.Max(asset.SalvageValue, Math.Round(calculatedValue, 2));
        }
    }
}