using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using CentraLog.Core.Domain.Entities;
using CentraLog.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CentraLog.Infrastructure.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // =========================================================================
            // 1. IDENTITY INJECTION ENGINE (PRECONDITIONS FOR AUTH & RBAC GATES)
            // =========================================================================
            if (!await context.Users.AnyAsync())
            {
                var seedUsers = new List<User>
                {
                    new User
                    {
                        Username = "admin_cl",
                        Email = "admin@centralog.com",
                        PasswordHash = ComputeSecureHash("AdminPass123!"),
                        Role = UserRole.SystemAdmin,
                        CreatedAt = DateTime.UtcNow.AddMonths(-6)
                    },
                    new User
                    {
                        Username = "manager_cl",
                        Email = "manager@centralog.com",
                        PasswordHash = ComputeSecureHash("ManagerPass123!"),
                        Role = UserRole.Manager,
                        CreatedAt = DateTime.UtcNow.AddMonths(-6)
                    },
                    new User
                    {
                        Username = "staff_cl",
                        Email = "staff@centralog.com",
                        PasswordHash = ComputeSecureHash("StaffPass123!"),
                        Role = UserRole.InventoryStaff,
                        CreatedAt = DateTime.UtcNow.AddMonths(-6)
                    },
                    new User
                    {
                        Username = "accountant_cl",
                        Email = "accountant@centralog.com",
                        PasswordHash = ComputeSecureHash("AccountantPass123!"),
                        Role = UserRole.Accountant,
                        CreatedAt = DateTime.UtcNow.AddMonths(-6)
                    }
                };

                await context.Users.AddRangeAsync(seedUsers);
                await context.SaveChangesAsync();
            }

            // =========================================================================
            // 2. HARDWARE ENVIRONMENT CONDITIONING ENGINE (INSTITUTIONAL SEED FLEET)
            // =========================================================================
            var timestamp = DateTime.UtcNow;

            // Force clear stale legacy records to synchronize schema mappings
            if (await context.Assets.AnyAsync())
            {
                context.Assets.RemoveRange(context.Assets);
                await context.SaveChangesAsync();
            }

            var defaultAssets = new List<Asset>
            {
                new Asset
                {
                    Name = "KIWI 15.6\" Digital Tabletop Display Unit",
                    PropertyNumber = "SPHV-2026-02-0042",
                    SerialNumber = "KW16TSDTD2026124-80008",
                    AccountCategory = "Semi-Expendable Information and Communications Technology Equipment",
                    CategoryTag = "Workstations",
                    ProcurementCost = 34999.00m,
                    AcquisitionDate = new DateTime(2026, 2, 26, 0, 0, 0, DateTimeKind.Utc),
                    RoomId = 101,
                    CustodianId = 1,
                    LifecycleState = LifecycleState.Active,
                    CreatedAt = timestamp.AddMonths(-3),
                    UpdatedAt = timestamp.AddMonths(-3),
                    NextServiceDate = DateTime.UtcNow.AddMonths(3),
                    IsMaintenanceFlagged = false,
                    ExpectedLifespanMonths = 36,
                    DepreciationMethod = DepreciationAlgorithm.StraightLine,
                    SalvageValue = 3500.00m,
                    Description = "Serial No.: KW16TSDTD2026124-80008 KIWI 15.6\" DIGITAL TABLETOP DISPLAY SIZE: 15.6\" BRAND: KIWI DIGITAL DISPLAY SYSTEM.",
                    IsStickerQueued = true
                },
                new Asset
                {
                    Name = "Lenovo Legion R7 Workstation (RTX 4060)",
                    PropertyNumber = "SPHV-2026-02-0001",
                    SerialNumber = "PF49X1K2-LGN202688",
                    AccountCategory = "ICT Equipment - Information Systems Workstations",
                    CategoryTag = "Workstations",
                    ProcurementCost = 65000.00m,
                    AcquisitionDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                    RoomId = 101,
                    CustodianId = 1,
                    LifecycleState = LifecycleState.Active,
                    CreatedAt = timestamp.AddMonths(-4),
                    UpdatedAt = timestamp.AddMonths(-4),
                    NextServiceDate = DateTime.UtcNow.AddMonths(2),
                    IsMaintenanceFlagged = false,
                    ExpectedLifespanMonths = 60,
                    DepreciationMethod = DepreciationAlgorithm.DoubleDeclining,
                    SalvageValue = 6500.00m,
                    Description = "Lenovo Legion R7 AMD Ryzen 7 7840HS, 16GB DDR5 RAM, 1TB NVMe SSD, NVIDIA GeForce RTX 4060 GPU.",
                    IsStickerQueued = false
                },
                new Asset
                {
                    Name = "Cisco Catalyst 24-Port Managed Network Switch",
                    PropertyNumber = "SPHV-2026-02-0002",
                    SerialNumber = "FOC2439L9XX-CS2026",
                    AccountCategory = "ICT Infrastructure - Network Hardware",
                    CategoryTag = "Infrastructure",
                    ProcurementCost = 18500.00m,
                    AcquisitionDate = new DateTime(2025, 11, 10, 0, 0, 0, DateTimeKind.Utc),
                    RoomId = 202,
                    CustodianId = 2,
                    LifecycleState = LifecycleState.Active,
                    CreatedAt = timestamp.AddMonths(-6),
                    UpdatedAt = timestamp.AddMonths(-6),
                    NextServiceDate = DateTime.UtcNow.AddMonths(1),
                    IsMaintenanceFlagged = false,
                    ExpectedLifespanMonths = 48,
                    DepreciationMethod = DepreciationAlgorithm.StraightLine,
                    SalvageValue = 1850.00m,
                    Description = "Cisco Catalyst 24-Port Gigabit Ethernet Switch with PoE+ capabilities for primary server rack distribution.",
                    IsStickerQueued = false
                },
                new Asset
                {
                    Name = "Core Edge Router A1 (Preventative Alert Tripped)",
                    PropertyNumber = "SPHV-2026-02-0003",
                    SerialNumber = "CER-A1-88942-RT2026",
                    AccountCategory = "ICT Infrastructure - Network Hardware",
                    CategoryTag = "Infrastructure",
                    ProcurementCost = 45000.00m,
                    AcquisitionDate = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                    RoomId = 202,
                    CustodianId = 2,
                    LifecycleState = LifecycleState.Active,
                    CreatedAt = timestamp.AddMonths(-12),
                    UpdatedAt = timestamp.AddDays(-1),
                    NextServiceDate = DateTime.UtcNow.AddDays(-5), // Overdue date triggers background daemon flag
                    IsMaintenanceFlagged = true,
                    ExpectedLifespanMonths = 48,
                    DepreciationMethod = DepreciationAlgorithm.StraightLine,
                    SalvageValue = 4500.00m,
                    Description = "Enterprise core boundary router unit. Flagged automatically for diagnostic thermal paste replacement and firmware calibration.",
                    IsStickerQueued = true
                },
                new Asset
                {
                    Name = "Epson EcoTank L3250 Multifunction Wi-Fi Printer",
                    PropertyNumber = "SPHV-2026-02-0010",
                    SerialNumber = "X8K2930291-EPS2026",
                    AccountCategory = "Office Equipment - Printing Systems",
                    CategoryTag = "Peripherals",
                    ProcurementCost = 11200.00m,
                    AcquisitionDate = new DateTime(2025, 8, 20, 0, 0, 0, DateTimeKind.Utc),
                    RoomId = 101,
                    CustodianId = 1,
                    LifecycleState = LifecycleState.Active,
                    CreatedAt = timestamp.AddMonths(-8),
                    UpdatedAt = timestamp.AddMonths(-8),
                    NextServiceDate = DateTime.UtcNow.AddMonths(4),
                    IsMaintenanceFlagged = false,
                    ExpectedLifespanMonths = 36,
                    DepreciationMethod = DepreciationAlgorithm.StraightLine,
                    SalvageValue = 1000.00m,
                    Description = "EcoTank All-in-One Ink Tank printer utilized for administrative document processing and official correspondence printing.",
                    IsStickerQueued = false
                }
            };

            await context.Assets.AddRangeAsync(defaultAssets);
            await context.SaveChangesAsync();
        }

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