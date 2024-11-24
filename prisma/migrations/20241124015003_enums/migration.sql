/*
  Warnings:

  - You are about to drop the column `allMessages` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `checkInStreak` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `currentState` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dailyCheckInDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastCheckInTime` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalMessages` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `weeklyCheckInDate` on the `User` table. All the data in the column will be lost.
  - Added the required column `eveningCheckInTime` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DAY" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "allMessages",
DROP COLUMN "checkInStreak",
DROP COLUMN "currentState",
DROP COLUMN "dailyCheckInDate",
DROP COLUMN "lastCheckInTime",
DROP COLUMN "lastMessage",
DROP COLUMN "totalMessages",
DROP COLUMN "weeklyCheckInDate",
ADD COLUMN     "eveningCheckInTime" TIMETZ(0) NOT NULL,
ADD COLUMN     "morningCheckInTime" TIMETZ(0);

-- DropEnum
DROP TYPE "ConversationState";

-- CreateTable
CREATE TABLE "TimeTrigger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" "DAY" NOT NULL,
    "time" TIMETZ(0) NOT NULL,

    CONSTRAINT "TimeTrigger_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TimeTrigger" ADD CONSTRAINT "TimeTrigger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
