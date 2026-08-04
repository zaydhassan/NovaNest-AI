import { db } from "@/lib/prisma";

export function parseFeedback(mock) {
  if (!mock) return null;

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

  return {
    score: Number(mock.score ?? NaN) || null,
    communication: Number(mock.communicationScore ?? NaN) || null,
    technicalDepth: Number(mock.technicalDepthScore ?? NaN) || null,
    structure: Number(mock.structureScore ?? NaN) || null,
    strengths: Array.isArray(mock.strengths) ? mock.strengths : [],
    improvements: Array.isArray(mock.improvements) ? mock.improvements : [],
  };
}

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