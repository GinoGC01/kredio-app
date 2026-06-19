-- AlterTable: add last_activity_at to users
ALTER TABLE "users" ADD COLUMN "last_activity_at" TIMESTAMP(3);

-- AlterTable: remove last_activity_at from credits (wrong table)
ALTER TABLE "credits" DROP COLUMN IF EXISTS "last_activity_at";
