/*
  Warnings:

  - You are about to drop the column `goalsAgainst` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `goalsFor` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `isHome` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `opponent` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `headshotUrl` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the `Goal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MatchAppearance` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[apiFixtureId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `apiFixtureId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `awayTeamId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `awayTeamLogo` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `awayTeamName` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `homeTeamId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `homeTeamLogo` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `homeTeamName` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `season` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apiId` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Player` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_matchId_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_playerId_fkey";

-- DropForeignKey
ALTER TABLE "MatchAppearance" DROP CONSTRAINT "MatchAppearance_matchId_fkey";

-- DropForeignKey
ALTER TABLE "MatchAppearance" DROP CONSTRAINT "MatchAppearance_playerId_fkey";

-- DropIndex
DROP INDEX "Match_date_idx";

-- DropIndex
DROP INDEX "Player_name_idx";

-- AlterTable
CREATE SEQUENCE match_id_seq;
ALTER TABLE "Match" DROP COLUMN "goalsAgainst",
DROP COLUMN "goalsFor",
DROP COLUMN "isHome",
DROP COLUMN "opponent",
ADD COLUMN     "apiFixtureId" INTEGER NOT NULL,
ADD COLUMN     "awayScore" INTEGER,
ADD COLUMN     "awayTeamId" INTEGER NOT NULL,
ADD COLUMN     "awayTeamLogo" TEXT NOT NULL,
ADD COLUMN     "awayTeamName" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "elapsed" INTEGER,
ADD COLUMN     "fulltimeScore" TEXT,
ADD COLUMN     "halftimeScore" TEXT,
ADD COLUMN     "homeScore" INTEGER,
ADD COLUMN     "homeTeamId" INTEGER NOT NULL,
ADD COLUMN     "homeTeamLogo" TEXT NOT NULL,
ADD COLUMN     "homeTeamName" TEXT NOT NULL,
ADD COLUMN     "referee" TEXT,
ADD COLUMN     "round" TEXT,
ADD COLUMN     "season" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "statusLong" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "venue" TEXT,
ALTER COLUMN "id" SET DEFAULT nextval('match_id_seq');
ALTER SEQUENCE match_id_seq OWNED BY "Match"."id";

-- AlterTable
CREATE SEQUENCE player_id_seq;
ALTER TABLE "Player" DROP COLUMN "dateOfBirth",
DROP COLUMN "headshotUrl",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "apiId" INTEGER NOT NULL,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "firstname" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "injured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastname" TEXT,
ADD COLUMN     "number" INTEGER,
ADD COLUMN     "photo" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "weight" TEXT,
ALTER COLUMN "id" SET DEFAULT nextval('player_id_seq'),
ALTER COLUMN "nationality" DROP NOT NULL,
ALTER COLUMN "position" DROP NOT NULL;
ALTER SEQUENCE player_id_seq OWNED BY "Player"."id";

-- DropTable
DROP TABLE "Goal";

-- DropTable
DROP TABLE "MatchAppearance";

-- CreateTable
CREATE TABLE "MatchStat" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "playerId" INTEGER,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "shotsTotal" INTEGER NOT NULL DEFAULT 0,
    "shotsOnTarget" INTEGER NOT NULL DEFAULT 0,
    "passesTotal" INTEGER NOT NULL DEFAULT 0,
    "passesKey" INTEGER NOT NULL DEFAULT 0,
    "passAccuracy" DOUBLE PRECISION,
    "tackles" INTEGER NOT NULL DEFAULT 0,
    "blocks" INTEGER NOT NULL DEFAULT 0,
    "interceptions" INTEGER NOT NULL DEFAULT 0,
    "duelsTotal" INTEGER NOT NULL DEFAULT 0,
    "duelsWon" INTEGER NOT NULL DEFAULT 0,
    "dribblesAttempts" INTEGER NOT NULL DEFAULT 0,
    "dribblesSuccess" INTEGER NOT NULL DEFAULT 0,
    "foulsCommitted" INTEGER NOT NULL DEFAULT 0,
    "foulsDrawn" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "xG" DOUBLE PRECISION,
    "xA" DOUBLE PRECISION,
    "progressivePasses" INTEGER,
    "progressiveCarries" INTEGER,
    "shotCreatingActions" INTEGER,
    "rawStatsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_apiFixtureId_key" ON "Match"("apiFixtureId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_apiId_key" ON "Player"("apiId");

-- AddForeignKey
ALTER TABLE "MatchStat" ADD CONSTRAINT "MatchStat_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchStat" ADD CONSTRAINT "MatchStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
