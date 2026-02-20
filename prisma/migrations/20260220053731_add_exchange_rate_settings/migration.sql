-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "autoUpdateRates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currentExchangeRate" DECIMAL(10,4) NOT NULL DEFAULT 28.0000,
ADD COLUMN     "lastRateUpdate" TIMESTAMP(3),
ALTER COLUMN "trialEndsAt" SET DEFAULT NOW() + interval '3 days';
