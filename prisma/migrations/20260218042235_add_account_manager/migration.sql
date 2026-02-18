-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPPORT_AGENT';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "accountManagerId" TEXT,
ALTER COLUMN "trialEndsAt" SET DEFAULT NOW() + interval '3 days';

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
