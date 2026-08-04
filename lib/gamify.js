import { db } from "@/lib/prisma";

export const XP_BY_EVENT = {
  resume_saved: 20,
  cover_letter: 15,
  quiz_completed: 25,
  mock_interview: 40,
  application_logged: 10,
  application_advanced: 5,
  onboarding: 30,
  coach_message: 5,
  memory_write: 1,
  github_connected: 30,
  twin_rebuilt: 20,
  learning_session: 15,
  goal_set: 25,
  timeline_milestone: 10,
};

function dayDiff(a, b) {
  const ms = 1000 * 60 * 60 * 24;
  const da = new Date(a).setHours(0, 0, 0, 0);
  const db2 = new Date(b).setHours(0, 0, 0, 0);
  return Math.round((db2 - da) / ms);
}

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