-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "credits" ADD COLUMN     "frequency" "PaymentFrequency" NOT NULL DEFAULT 'MONTHLY';
