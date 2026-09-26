using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CentraLog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLogChangeSummary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChangeSummary",
                table: "auditlogs",
                type: "varchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />  
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChangeSummary",
                table: "auditlogs");
        }
    }
}
