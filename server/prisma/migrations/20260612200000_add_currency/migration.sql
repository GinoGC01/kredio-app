-- CreateEnum: Currency
CREATE TYPE "Currency" AS ENUM ('ARS', 'USD');

-- AlterTable: add currency column to credits with default ARS
ALTER TABLE "credits" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'ARS';
