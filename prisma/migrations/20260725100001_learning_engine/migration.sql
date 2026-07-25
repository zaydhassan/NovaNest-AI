-- M9 — Learning Engine (additive).
-- Adds CareerGoal + LearningTopic + LearningSession tables (all user-owned,
-- CASCADE on userId; LearningSession.topicId SET NULL when a topic is
-- deleted). No DropColumn/AlterColumn — independently revertible by dropping
-- the three tables.

-- CreateTable
CREATE TABLE "CareerGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "targetLevel" TEXT,
    "timeframe" TEXT,
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningTopic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "proficiency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "resources" JSONB,
    "lastTouchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT,
    "kind" TEXT NOT NULL,
    "sourceId" TEXT,
    "summary" TEXT,
    "outcome" JSONB,
    "durationMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerGoal_userId_idx" ON "CareerGoal"("userId");

-- CreateIndex
CREATE INDEX "CareerGoal_userId_status_idx" ON "CareerGoal"("userId", "status");

-- CreateIndex
CREATE INDEX "LearningTopic_userId_idx" ON "LearningTopic"("userId");

-- CreateIndex
CREATE INDEX "LearningTopic_userId_status_idx" ON "LearningTopic"("userId", "status");

-- CreateIndex
CREATE INDEX "LearningSession_userId_idx" ON "LearningSession"("userId");

-- CreateIndex
CREATE INDEX "LearningSession_userId_topicId_idx" ON "LearningSession"("userId", "topicId");

-- CreateIndex
CREATE INDEX "LearningSession_userId_createdAt_idx" ON "LearningSession"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "CareerGoal" ADD CONSTRAINT "CareerGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningTopic" ADD CONSTRAINT "LearningTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "LearningTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;