using CentraLog.Core.Domain.Entities;
using System;
using System.Collections.Generic;

namespace CentraLog.Core.DTOs
{
    // The master wrapper returning the Asset context along with its trail
    public class AssetHistoryDto
    {
        public int AssetId { get; set; }

        // Aligns perfectly with the assignments executed in AssetService.cs
        public List<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    }

    // Individual timeline event slots
    public class AuditLogTimelineEntryDto
    {
        public int LogId { get; set; }
        public int OldRoomId { get; set; }
        public int NewRoomId { get; set; }
        public int OldCustodianId { get; set; }
        public int NewCustodianId { get; set; }
        public int ModifiedByUserId { get; set; }
        public DateTime Timestamp { get; set; }
    }
}