-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gracePeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "pesepayToken" TEXT,
ALTER COLUMN "trialEndsAt" SET DEFAULT NOW() + interval '3 days';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpires" TIMESTAMP(3);
