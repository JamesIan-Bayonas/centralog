namespace CentraLog.Core.Domain.Enums;

public enum LifecycleState
{
    Procured = 1,      // Asset has been registered in the system[cite: 2]
    Active = 2,        // Asset is deployed and active in its assigned room[cite: 2]
    InMaintenance = 3, // Asset is undergoing calibration or repair workflows[cite: 2]
    Depreciated = 4,   // Asset has completely lost its standard financial valuation[cite: 2]
    Disposed = 5       // Asset is discarded or sold; record is completely unmodifiable[cite: 2]
}