/*
  Warnings:

  - You are about to drop the column `copingStrategies` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `triggers` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "copingStrategies",
DROP COLUMN "triggers";
