-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "trialEndsAt" SET DEFAULT NOW() + interval '3 days';
