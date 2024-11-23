-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "gender" TEXT,
    "age" INTEGER,
    "workStatus" TEXT,
    "relationshipStatus" TEXT,
    "homeStatus" TEXT,
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "allMessages" TEXT[],
    "lastMessage" TEXT,
    "currentState" TEXT,
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

