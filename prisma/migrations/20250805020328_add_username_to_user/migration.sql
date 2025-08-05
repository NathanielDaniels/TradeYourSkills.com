/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "username" TEXT;

-- Default value for Existing users 
ALTER TABLE "User" ADD COLUMN "username" TEXT NOT NULL DEFAULT 'temp_username';

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

