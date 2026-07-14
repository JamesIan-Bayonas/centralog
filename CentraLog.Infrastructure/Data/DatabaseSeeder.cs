using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using CentraLog.Core.Domain.Entities;
using CentraLog.Core.Domain.Enums;

namespace CentraLog.Infrastructure.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // =========================================================================
            // 1. IDENTITY INJECTION ENGINE (PRECONDITIONS FOR AUTH & RBAC GATES)
            // =========================================================================
            if (!context.Users.Any())
            {
                var seedUsers = new List<User>
                {
                    new User
                    {
                        Username = "admin_cl",
                        Email = "admin@centralog.com",
                        PasswordHash = ComputeSecureHash("AdminPass123!"),
                        Role = UserRole.SystemAdmin
                    },
                    new User
                    {
                        Username = "manager_cl",
                        Email = "manager@centralog.com",
                        PasswordHash = ComputeSecureHash("ManagerPass123!"),
                        Role = UserRole.Manager
                    },
                    new User
                    {
                        Username = "staff_cl",
                        Email = "staff@centralog.com",
                        PasswordHash = ComputeSecureHash("StaffPass123!"),
                        Role = UserRole.InventoryStaff
                    },
                    new User
                    {
                        Username = "accountant_cl",
                        Email = "accountant@centralog.com",
                        PasswordHash = ComputeSecureHash("AccountantPass123!"),
                        Role = UserRole.Accountant
                    }
                };

                await context.Users.AddRangeAsync(seedUsers);
                await context.SaveChangesAsync();
            }

            // =========================================================================
            // 2. HARDWARE ENVIRONMENT CONDITIONING ENGINE (SYSTEM SANDBOX DATA)
            // =========================================================================
            var timestamp = DateTime.UtcNow;

            var defaultAssets = new List<Asset>
            {
                new Asset
                {
                    Name = "Lenovo Legion R7 (RTX 4060)",
                    CategoryTag = "Workstations",
                    ProcurementCost = 65000.00m,
                    RoomId = 101,
                    CustodianId = 1,
                    LifecycleState = LifecycleState.Active,
                    CreatedAt = timestamp.AddDays(-30),
                    UpdatedAt = timestamp.AddDays(-30),
                    NextServiceDate = DateTime.UtcNow.AddMonths(3),
                    IsMaintenanceFlagged = false
                },
                new Asset
                {
                    Name = "Cisco Catalyst 24-Port Network Switch",
                    CategoryTag = "Infrastructure",
                    ProcurementCost = 18500.00m,
                    RoomId = 202,
                    CustodianId = 2,
                    LifecycleState = LifecycleState.Active,
                    CreatedAt = timestamp.AddDays(-60),
                    UpdatedAt = timestamp.AddDays(-60),
                    NextServiceDate = DateTime.UtcNow.AddMonths(1),
                    IsMaintenanceFlagged = false
                },
                new Asset
                {
                    Name = "Core Edge Router A1 (Overdue Demo)",
                    CategoryTag = "Infrastructure",
                    ProcurementCost = 45000.00m,
                    RoomId = 202,
                    CustodianId = 2,
                    LifecycleState = LifecycleState.Active,
                    CreatedAt = timestamp.AddMonths(-12),
                    UpdatedAt = timestamp.AddMonths(-6),
                    NextServiceDate = DateTime.UtcNow.AddDays(-5),
                    IsMaintenanceFlagged = false
                }
            };

            // Force clear old asset tracking entries to align with the new schema structure definitions
            context.Assets.RemoveRange(context.Assets);
            await context.SaveChangesAsync();

            // Inject the corrected asset fleet rows into the relational database context
            await context.Assets.AddRangeAsync(defaultAssets);
            await context.SaveChangesAsync();
        } // ◄── THIS CLOSES THE SeedAsync METHOD RECTANGULAR MATRIX CLEARLY

        // =========================================================================
        // 3. CRYPTOGRAPHIC UTILITY (PREVENTS PLAIN-TEXT STORAGE IN MYSQL)
        // =========================================================================
        private static string ComputeSecureHash(string password)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }
    }
}