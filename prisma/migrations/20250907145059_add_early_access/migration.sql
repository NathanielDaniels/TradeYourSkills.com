-- CreateTable
CREATE TABLE "public"."EarlyAccess" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EarlyAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EarlyAccess_email_key" ON "public"."EarlyAccess"("email");
