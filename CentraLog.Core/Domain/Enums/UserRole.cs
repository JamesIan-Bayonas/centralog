namespace CentraLog.Core.Domain.Enums
{
    public enum UserRole
    {
        GeneralStaff = 1,
        InventoryStaff = 2, // Authorized for UC-06 Lifecycle Operations
        Manager = 3,        // Authorized for UC-05 Logistics Transfers
        SystemAdmin = 4,    // Superuser clearance over all layers
        Accountant = 5      // ◄── ADDED FOR FEATURE 7 COMPLIANCE AUDITS
    }
}