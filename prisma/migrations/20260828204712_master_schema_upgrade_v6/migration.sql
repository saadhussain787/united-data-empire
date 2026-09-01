/*
  Warnings:

  - You are about to drop the column `dribblesAttempts` on the `MatchStat` table. All the data in the column will be lost.
  - You are about to drop the column `dribblesSuccess` on the `MatchStat` table. All the data in the column will be lost.
  - You are about to drop the column `foulsCommitted` on the `MatchStat` table. All the data in the column will be lost.
  - You are about to drop the column `foulsDrawn` on the `MatchStat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "awayGoalscorers" JSONB,
ADD COLUMN     "cards" JSONB,
ADD COLUMN     "homeGoalscorers" JSONB,
ADD COLUMN     "shotData" JSONB,
ADD COLUMN     "substitutions" JSONB,
ADD COLUMN     "teamStats" JSONB;

-- AlterTable
ALTER TABLE "MatchStat" DROP COLUMN "dribblesAttempts",
DROP COLUMN "dribblesSuccess",
DROP COLUMN "foulsCommitted",
DROP COLUMN "foulsDrawn",
ADD COLUMN     "cleanSheet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "goalsConceded" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "agent" TEXT,
ADD COLUMN     "bootSponsor" TEXT,
ADD COLUMN     "contractEnd" TIMESTAMP(3),
ADD COLUMN     "injuryDetail" TEXT,
ADD COLUMN     "injuryReturn" TEXT,
ADD COLUMN     "isActiveSquad" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isOnLoan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loanClub" TEXT,
ADD COLUMN     "preferredFoot" TEXT;

-- CreateTable
CREATE TABLE "Transfer" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER,
    "playerName" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "window" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "isIncoming" BOOLEAN NOT NULL,
    "otherClub" TEXT NOT NULL,
    "otherClubLogo" TEXT,
    "fee" TEXT NOT NULL,
    "transferType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerAttribute" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "pace" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "shooting" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "passing" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "dribbling" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "defending" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "physical" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketValue" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "valueMillions" DOUBLE PRECISION NOT NULL,
    "clubName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerHistory" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "clubName" TEXT NOT NULL,
    "clubLogo" TEXT,
    "season" TEXT NOT NULL,
    "appearances" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trophy" (
    "id" SERIAL NOT NULL,
    "competitionName" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "winningSeasons" TEXT[],
    "trophyImage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trophy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalCampaign" (
    "id" SERIAL NOT NULL,
    "season" TEXT NOT NULL,
    "competition" TEXT NOT NULL,
    "milestone" TEXT NOT NULL,
    "isChampion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricalCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manager" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "photo" TEXT,
    "appointedDate" TIMESTAMP(3) NOT NULL,
    "leftDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "winPercentage" DOUBLE PRECISION,
    "preferredShape" TEXT,
    "transferSpend" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manager_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerAttribute_playerId_key" ON "PlayerAttribute"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Trophy_competitionName_key" ON "Trophy"("competitionName");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAttribute" ADD CONSTRAINT "PlayerAttribute_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketValue" ADD CONSTRAINT "MarketValue_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerHistory" ADD CONSTRAINT "CareerHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
