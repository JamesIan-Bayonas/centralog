using System;
using System.Collections.Generic;
using CentraLog.Core.Domain.Entities;

namespace CentraLog.Core.Interfaces
{
    public interface IDepreciationStrategy
    {
        decimal CalculateBookValue(Asset asset, List<MaintenanceLog> logs, DateTime evaluationTime);
    }
}