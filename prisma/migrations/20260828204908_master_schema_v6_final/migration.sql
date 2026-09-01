-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "intervalStats" JSONB;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "mediaSentiment" DOUBLE PRECISION;
