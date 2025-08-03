-- AlterTable
ALTER TABLE "public"."Skill" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "profileVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "state" TEXT;
