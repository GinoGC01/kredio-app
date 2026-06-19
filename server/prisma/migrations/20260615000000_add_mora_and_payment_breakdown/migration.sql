-- CreateEnum
CREATE TYPE "MoraType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "MoraPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "credits" ADD COLUMN     "mora_period" "MoraPeriod",
ADD COLUMN     "mora_rate" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "mora_type" "MoraType";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "interest_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "mora_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "original_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;
