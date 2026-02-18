-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "extraClientSlots" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "trialEndsAt" SET DEFAULT NOW() + interval '3 days';
