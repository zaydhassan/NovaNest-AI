-- Career OS M8 - AI Career Twin (additive). Creates the CareerTwin table (one row per user, userId @unique).
-- Purely additive (CreateTable + unique/index + FK; no drop/alter of existing).

-- CreateTable
CREATE TABLE "CareerTwin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profile" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerTwin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerTwin_userId_key" ON "CareerTwin"("userId");

-- CreateIndex
CREATE INDEX "CareerTwin_userId_idx" ON "CareerTwin"("userId");

-- AddForeignKey
ALTER TABLE "CareerTwin" ADD CONSTRAINT "CareerTwin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

