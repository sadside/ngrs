/*
  Warnings:

  - You are about to drop the column `driverId` on the `waybills` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "waybills" DROP CONSTRAINT "waybills_driverId_fkey";

-- AlterTable
ALTER TABLE "waybills" DROP COLUMN "driverId";
