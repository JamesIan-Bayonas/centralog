using CentraLog.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace CentraLog.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Explicit Relational Schema Table Registries
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Fluent API Architecture Design Patterns
        modelBuilder.Entity<Asset>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CategoryTag).HasMaxLength(100);
            entity.Property(e => e.ProcurementCost).HasColumnType("decimal(18,2)");
            entity.Property(e => e.LifecycleState).HasConversion<int>(); // Persist Enum as native integer flags
        });     

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Timestamp).IsRequired();
        });
    }
}