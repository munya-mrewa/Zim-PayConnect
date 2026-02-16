-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PURCHASE_CREDIT';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "logoUrl" TEXT,
ALTER COLUMN "trialEndsAt" SET DEFAULT NOW() + interval '7 days';
