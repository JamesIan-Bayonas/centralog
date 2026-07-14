using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CentraLog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetExpectedLifespanCompliance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Existing expected lifespan constraint column
            migrationBuilder.AddColumn<int>(
                name: "ExpectedLifespanMonths",
                table: "Assets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // 2. REPAIR ADDITION: Inject missing DepreciationMethod mapping column into assets table
            migrationBuilder.AddColumn<int>(
                name: "DepreciationMethod",
                table: "Assets",
                type: "int",
                nullable: false,
                defaultValue: 1); // Defaults to StraightLine (1)

            // 3. REPAIR ADDITION: Inject missing SalvageValue financial column into assets table
            migrationBuilder.AddColumn<decimal>(
                name: "SalvageValue",
                table: "Assets",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0.00m);

            // 4. Existing users table generation schema logic
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Username = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PasswordHash = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Role = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropColumn(
                name: "ExpectedLifespanMonths",
                table: "Assets");

            // REPAIR ADDITION: Safe rollback capability anchors
            migrationBuilder.DropColumn(
                name: "DepreciationMethod",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "SalvageValue",
                table: "Assets");
        }
    }
}