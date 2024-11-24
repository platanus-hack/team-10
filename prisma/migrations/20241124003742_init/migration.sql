-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'IN_RELATIONSHIP', 'COMPLICATED', 'OTHER');

-- CreateEnum
CREATE TYPE "HomeStatus" AS ENUM ('LIVES_ALONE', 'LIVES_WITH_FAMILY', 'LIVES_WITH_ROOMMATES', 'HOMELESS', 'OTHER');

-- CreateEnum
CREATE TYPE "ConversationState" AS ENUM ('IDLE', 'ONBOARDING', 'IN_CONVERSATION', 'CHECKIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "gender" "Gender",
    "age" INTEGER,
    "workStatus" "WorkStatus",
    "relationshipStatus" "RelationshipStatus",
    "homeStatus" "HomeStatus",
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "allMessages" TEXT[],
    "lastMessage" TEXT,
    "currentState" "ConversationState",
    "triggers" TEXT[],
    "copingStrategies" TEXT[],
    "riskLevel" INTEGER NOT NULL DEFAULT 0,
    "sobrietyStartDate" TIMESTAMP(3),
    "checkInStreak" INTEGER NOT NULL DEFAULT 0,
    "weeklyCheckInDate" TIMESTAMP(3),
    "dailyCheckInDate" TIMESTAMP(3),
    "lastCheckInTime" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");
