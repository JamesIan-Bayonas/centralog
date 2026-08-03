using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CentraLog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInstitutionalPropertyExtensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // KEEP the lowercase table rename logic EF generated
            migrationBuilder.RenameTable(name: "Users", newName: "users");
            migrationBuilder.RenameTable(name: "MaintenanceLogs", newName: "maintenancelogs");
            migrationBuilder.RenameTable(name: "AuditLogs", newName: "auditlogs");
            migrationBuilder.RenameTable(name: "Assets", newName: "assets");

            // KEEP the new Institutional Properties
            migrationBuilder.AddColumn<string>(name: "PropertyNumber", table: "assets", type: "longtext", nullable: false, defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(name: "SerialNumber", table: "assets", type: "longtext", nullable: false, defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(name: "AcquisitionDate", table: "assets", type: "datetime(6)", nullable: false, defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(name: "AccountCategory", table: "assets", type: "longtext", nullable: false, defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(name: "ImageUrl", table: "assets", type: "longtext", nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(name: "IsStickerQueued", table: "assets", type: "tinyint(1)", nullable: false, defaultValue: false);

            migrationBuilder.AddColumn<string>(name: "Description", table: "assets", type: "longtext", nullable: false, defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            // ❌ DELETE THIS BLOCK IF IT EXISTS:
            // migrationBuilder.AddColumn<int>(name: "DepreciationMethod", table: "assets", type: "int", nullable: false, defaultValue: 0);

            // ❌ DELETE THIS BLOCK IF IT EXISTS:
            // migrationBuilder.AddColumn<decimal>(name: "SalvageValue", table: "assets", type: "decimal(18,2)", nullable: false, defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_users",
                table: "users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_maintenancelogs",
                table: "maintenancelogs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_auditlogs",
                table: "auditlogs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_assets",
                table: "assets");

            migrationBuilder.DropColumn(
                name: "AccountCategory",
                table: "assets");

            migrationBuilder.DropColumn(
                name: "AcquisitionDate",
                table: "assets");

            migrationBuilder.DropColumn(
                name: "DepreciationMethod",
                table: "assets");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "assets");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "assets");

            migrationBuilder.DropColumn(
                name: "IsStickerQueued",
                table: "assets");

            migrationBuilder.DropColumn(
                name: "PropertyNumber",
                table: "assets");

            migrationBuilder.DropColumn(
                name: "SalvageValue",
                table: "assets");

            migrationBuilder.DropColumn(
                name: "SerialNumber",
                table: "assets");

            migrationBuilder.RenameTable(
                name: "users",
                newName: "Users");

            migrationBuilder.RenameTable(
                name: "maintenancelogs",
                newName: "MaintenanceLogs");

            migrationBuilder.RenameTable(
                name: "auditlogs",
                newName: "AuditLogs");

            migrationBuilder.RenameTable(
                name: "assets",
                newName: "Assets");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Users",
                table: "Users",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MaintenanceLogs",
                table: "MaintenanceLogs",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AuditLogs",
                table: "AuditLogs",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Assets",
                table: "Assets",
                column: "Id");
        }
    }
}
