/**
 * Interview memory helpers — typed access to the JSON-stringified
 * `MockInterview.feedback` + backfill of the denormalized columns (M3).
 *
 * `parseFeedback` is the single accessor every consumer (the analytics trend
 * builder in M6, the Interview agent in M5) should use so the fragile
 * JSON.parse lives in one place and degrades gracefully on old/malformed rows.
 *
 * Server-only.
 */
import { db } from "@/lib/prisma";

/**
 * Parse a MockInterview row's feedback into a structured object, falling back
 * to the denormalized columns (M3) when `feedback` is missing/malformed.
 *
 * @param {object} mock - a MockInterview row (needs feedback?, strengths?, improvements?, *Score?)
 * @returns {{ score?: number, communication?: number, technicalDepth?: number,
 *            structure?: number, strengths?: string[], improvements?: string[] } | null}
 */
export function parseFeedback(mock) {
  if (!mock) return null;

  // Prefer the structured `feedback` JSON; fall back to denormalized columns.
  let parsed = null;
  if (mock.feedback) {
    try {
      parsed = JSON.parse(mock.feedback);
    } catch {
      parsed = null;
    }
  }

  if (parsed && typeof parsed === "object") {
    return {
      score: Number(parsed.score ?? mock.score ?? NaN) || null,
      communication: Number(parsed.communication ?? NaN) || null,
      technicalDepth: Number(parsed.technicalDepth ?? NaN) || null,
      structure: Number(parsed.structure ?? NaN) || null,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    };
  }

  // Denormalized-column fallback (M3 rows, or backfilled old rows).
  return {
    score: Number(mock.score ?? NaN) || null,
    communication: Number(mock.communicationScore ?? NaN) || null,
    technicalDepth: Number(mock.technicalDepthScore ?? NaN) || null,
    structure: Number(mock.structureScore ?? NaN) || null,
    strengths: Array.isArray(mock.strengths) ? mock.strengths : [],
    improvements: Array.isArray(mock.improvements) ? mock.improvements : [],
  };
}

/**
 * Backfill the denormalized MockInterview columns from the JSON-stringified
 * `feedback` for rows that don't have them yet. Idempotent: only updates rows
 * where the denormalized fields are empty/null. Run once per user (M3 script /
 * Inngest job); safe to repeat.
 *
 * @param {string} userId
 * @param {any} [client] - prisma tx or db
 * @returns {Promise<{ updated: number, skipped: number }>}
 */
export async function backfillMockInterviews(userId, client = db) {
  const mocks = await client.mockInterview.findMany({
    where: {
      userId,
      OR: [
        { strengths: { isEmpty: true } },
        { improvements: { isEmpty: true } },
        { communicationScore: null },
      ],
    },
    select: {
      id: true,
      feedback: true,
      transcript: true,
    },
  });

  let updated = 0;
  let skipped = 0;
  for (const mock of mocks) {
    const f = parseFeedback(mock);
    if (!f || (!f.strengths.length && !f.improvements.length && f.communication == null)) {
      skipped++;
      continue;
    }
    await client.mockInterview.update({
      where: { id: mock.id },
      data: {
        strengths: f.strengths,
        improvements: f.improvements,
        communicationScore: f.communication,
        technicalDepthScore: f.technicalDepth,
        structureScore: f.structure,
        // Derive a questions array from the transcript's interviewer turns if
        // the row has a transcript (older rows may not have structured Qs).
        questions:
          Array.isArray(mock.transcript) && mock.transcript.length
            ? mock.transcript
                .filter((t) => t?.role === "interviewer")
                .map((t) => ({ question: t.text }))
            : undefined,
      },
    });
    updated++;
  }
  return { updated, skipped };
}