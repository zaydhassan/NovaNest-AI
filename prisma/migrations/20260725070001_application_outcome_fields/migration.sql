-- Career OS M6 — Application outcome context (additive).
-- Adds rejectionReason (REJECTED terminal status) + offerDetails (OFFER terminal
-- status) so the Application Detail view + AI recommendations can reason about
-- the two terminal pipeline outcomes. Purely additive (no drop/alter of
-- existing columns).

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "offerDetails" JSONB,
ADD COLUMN     "rejectionReason" TEXT;