-- Career OS M7 — GitHub Project Analyzer (additive).
-- Creates the GitHubRepo table (one row per connected repository). The PAT is
-- never stored — only its sha256 (patHash); the raw token travels in the
-- github/repo.connected Inngest event payload and is discarded after use.
-- Purely additive (CreateTable + indexes + FK; no drop/alter of existing).

-- CreateTable
CREATE TABLE "GitHubRepo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'github',
    "patHash" TEXT,
    "defaultBranch" TEXT,
    "description" TEXT,
    "language" TEXT,
    "stars" INTEGER,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "analysis" JSONB,
    "analysisStatus" TEXT NOT NULL DEFAULT 'pending',
    "analysisError" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubRepo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GitHubRepo_userId_idx" ON "GitHubRepo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRepo_userId_fullName_key" ON "GitHubRepo"("userId", "fullName");

-- AddForeignKey
ALTER TABLE "GitHubRepo" ADD CONSTRAINT "GitHubRepo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

