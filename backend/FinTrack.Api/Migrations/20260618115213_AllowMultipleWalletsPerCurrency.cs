using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrack.Api.Migrations
{
    /// <inheritdoc />
    public partial class AllowMultipleWalletsPerCurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_wallets_UserId_Currency",
                table: "wallets");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "wallets",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_wallets_Currency",
                table: "wallets",
                column: "Currency",
                unique: true,
                filter: "\"IsSystem\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_wallets_UserId",
                table: "wallets",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_wallets_Currency",
                table: "wallets");

            migrationBuilder.DropIndex(
                name: "IX_wallets_UserId",
                table: "wallets");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "wallets");

            migrationBuilder.CreateIndex(
                name: "IX_wallets_UserId_Currency",
                table: "wallets",
                columns: new[] { "UserId", "Currency" },
                unique: true);
        }
    }
}
