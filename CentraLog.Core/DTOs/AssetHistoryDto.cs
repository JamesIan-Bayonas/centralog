// File path: CentraLog.Core/DTOs/AssetHistoryDto.cs
using System;
using System.Collections.Generic;

namespace CentraLog.Core.DTOs
{
    public class AssetHistoryDto
    {
        public int AssetId { get; set; }
        public string AssetName { get; set; } = string.Empty;
        public List<AuditLogTimelineEntryDto> TimelineEntries { get; set; } = new();
    }

    public class AuditLogTimelineEntryDto
    {
        public int LogId { get; set; }
        public int OldRoomId { get; set; }
        public string OldRoomName { get; set; } = string.Empty;
        public int NewRoomId { get; set; }
        public string NewRoomName { get; set; } = string.Empty;
        public int OldCustodianId { get; set; }
        public string OldCustodianName { get; set; } = string.Empty;
        public int NewCustodianId { get; set; }
        public string NewCustodianName { get; set; } = string.Empty;
        public int ModifiedByUserId { get; set; }
        public string OperatorUsername { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}