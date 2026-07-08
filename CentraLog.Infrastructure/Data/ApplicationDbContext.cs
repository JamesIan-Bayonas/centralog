using CentraLog.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CentraLog.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // =========================================================================
        // RELATIONAL TABLE REGISTRIES (EXPOSED TO ACCESS ENGINES LIKE SEEDERS)
        // =========================================================================
        public DbSet<Asset> Assets => Set<Asset>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<MaintenanceLog> MaintenanceLogs => Set<MaintenanceLog>();

        // This line is now perfectly exposed as a public property for DatabaseSeeder!
        public DbSet<User> Users => Set<User>();

        // =========================================================================
        // FLUENT API SCHEMA CONFIGURATIONS
        // =========================================================================
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Force lowercase table naming mappings globally for Linux compatibility
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                var tableName = entity.GetTableName();
                if (!string.IsNullOrEmpty(tableName))
                {
                    // FIXED: Replaced non-existent ToLowerFallback() with native .ToLowerInvariant()
                    entity.SetTableName(tableName.ToLowerInvariant());
                }
            }

            // Asset Data Layout Map
            modelBuilder.Entity<Asset>(entity =>
            {
                entity.ToTable("assets"); // Enforces explicit lowercase name match
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.CategoryTag).HasMaxLength(100);
                entity.Property(e => e.ProcurementCost).HasColumnType("decimal(18,2)");
                entity.Property(e => e.LifecycleState).HasConversion<int>();
                entity.Property(e => e.IsMaintenanceFlagged).HasDefaultValue(false);
            });

            // Audit Trail Data Layout Map
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("auditlogs"); // Enforces explicit lowercase name match
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Timestamp).IsRequired();
            });

            // Maintenance Tracker Data Layout Map
            modelBuilder.Entity<MaintenanceLog>(entity =>
            {
                entity.ToTable("maintenancelogs"); // Enforces explicit lowercase name match
                entity.HasKey(e => e.Id);
                entity.Property(e => e.StartTime).IsRequired();
                entity.Property(e => e.RepairCost).HasColumnType("decimal(18,2)");
                entity.Property(e => e.ResolutionNotes).HasMaxLength(1000);
            });

            // User Identity Data Layout Map
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users"); // Enforces explicit lowercase name match
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
                entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(512);
                entity.Property(e => e.Role).HasConversion<int>(); // Maps authorization enums to integers
            });
        }
    }
}