using System;

namespace CentraLog.Core.Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public int AssetId { get; set; }
    public int OldRoomId { get; set; }
    public int NewRoomId { get; set; }
    public int OldCustodianId { get; set; }
    public int NewCustodianId { get; set; }
    public int ModifiedByUserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}