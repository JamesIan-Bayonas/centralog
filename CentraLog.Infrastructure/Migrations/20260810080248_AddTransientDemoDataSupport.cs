using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CentraLog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTransientDemoDataSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsTemporary",
                table: "assets",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "assets",
                type: "datetime(6)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsTemporary",
                table: "assets");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "assets");
        }
    }
}