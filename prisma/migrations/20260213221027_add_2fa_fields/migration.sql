-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "trialEndsAt" SET DEFAULT NOW() + interval '7 days';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorExpires" TIMESTAMP(3),
ADD COLUMN     "twoFactorToken" TEXT;
