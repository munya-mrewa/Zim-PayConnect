-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "trialEndsAt" SET DEFAULT NOW() + interval '7 days';
