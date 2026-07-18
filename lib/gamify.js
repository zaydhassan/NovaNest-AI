/**
 * Gamification helpers — streaks and XP.
 *
 * `bumpActivity` is called from server actions whenever the user does
 * something productive (saves a resume, completes a quiz, logs an application,
 * finishes a mock interview, generates a cover letter). It updates the user's
 * streak and adds XP. Streak logic: same-day activity doesn't extend the
 * streak (idempotent); a one-day gap increments; a longer gap resets to 1.
 *
 * Pure-ish: takes a Prisma transaction client (`tx`) OR the shared `db`, so it
 * can participate in an existing transaction or run standalone.
 */
import { db } from "@/lib/prisma";

const XP_BY_EVENT = {
  resume_saved: 20,
  cover_letter: 15,
  quiz_completed: 25,
  mock_interview: 40,
  application_logged: 10,
  application_advanced: 5,
  onboarding: 30,
};

function dayDiff(a, b) {
  const ms = 1000 * 60 * 60 * 24;
  const da = new Date(a).setHours(0, 0, 0, 0);
  const db2 = new Date(b).setHours(0, 0, 0, 0);
  return Math.round((db2 - da) / ms);
}

/**
 * Update streak + XP. Idempotent within a calendar day.
 *
 * @param {string} userId
 * @param {keyof typeof XP_BY_EVENT} event
 * @param {{ tx?: any, xp?: number }} [opts]
 */
export async function bumpActivity(userId, event, opts = {}) {
  const xpGain = opts.xp ?? XP_BY_EVENT[event] ?? 5;
  const client = opts.tx ?? db;

  const user = await client.user.findUnique({
    where: { id: userId },
    select: { streak: true, lastActiveAt: true },
  });
  if (!user) return;

  const now = new Date();
  let streak = user.streak || 0;

  if (user.lastActiveAt) {
    const diff = dayDiff(user.lastActiveAt, now);
    if (diff === 0) {
      // same day — keep streak, still award XP
    } else if (diff === 1) {
      streak = streak + 1;
    } else {
      streak = 1;
    }
  } else {
    streak = 1;
  }

  await client.user.update({
    where: { id: userId },
    data: {
      streak,
      xp: { increment: xpGain },
      lastActiveAt: now,
    },
  });
}