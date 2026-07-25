-- AlterTable
ALTER TABLE "MockInterview" ADD COLUMN     "communicationScore" DOUBLE PRECISION,
ADD COLUMN     "improvements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "questions" JSONB,
ADD COLUMN     "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "structureScore" DOUBLE PRECISION,
ADD COLUMN     "technicalDepthScore" DOUBLE PRECISION;