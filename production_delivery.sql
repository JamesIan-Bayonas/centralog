CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

START TRANSACTION;
ALTER DATABASE CHARACTER SET utf8mb4;

CREATE TABLE `Assets` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `CategoryTag` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `ProcurementCost` decimal(18,2) NOT NULL,
    `RoomId` int NOT NULL,
    `CustodianId` int NOT NULL,
    `LifecycleState` int NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Assets` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `AuditLogs` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `AssetId` int NOT NULL,
    `OldRoomId` int NOT NULL,
    `NewRoomId` int NOT NULL,
    `OldCustodianId` int NOT NULL,
    `NewCustodianId` int NOT NULL,
    `ModifiedByUserId` int NOT NULL,
    `Timestamp` datetime(6) NOT NULL,
    CONSTRAINT `PK_AuditLogs` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260706134252_InitialMySQLMigration', '9.0.0');

ALTER TABLE `Assets` ADD `IsMaintenanceFlagged` tinyint(1) NOT NULL DEFAULT FALSE;

ALTER TABLE `Assets` ADD `NextServiceDate` datetime(6) NULL;

CREATE TABLE `MaintenanceLogs` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `AssetId` int NOT NULL,
    `StartTime` datetime(6) NOT NULL,
    `EndTime` datetime(6) NULL,
    `PerformedByUserId` int NOT NULL,
    `ResolutionNotes` varchar(1000) CHARACTER SET utf8mb4 NOT NULL,
    `RepairCost` decimal(18,2) NOT NULL,
    CONSTRAINT `PK_MaintenanceLogs` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260706150051_UpdateAssetSchemaWithMaintenanceTracking', '9.0.0');

ALTER TABLE `Assets` ADD `ExpectedLifespanMonths` int NOT NULL DEFAULT 0;

ALTER TABLE `Assets` ADD `DepreciationMethod` int NOT NULL DEFAULT 1;

ALTER TABLE `Assets` ADD `SalvageValue` decimal(18,2) NOT NULL DEFAULT 0.0;

CREATE TABLE `Users` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Username` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Email` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `PasswordHash` varchar(512) CHARACTER SET utf8mb4 NOT NULL,
    `Role` int NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Users` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260706161041_AddAssetExpectedLifespanCompliance', '9.0.0');

COMMIT;

