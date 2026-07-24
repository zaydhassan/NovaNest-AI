/**
 * Persistent in-app notifications — creation helper.
 *
 * `createNotification` is the single entry point used by server actions (and
 * the Inngest weekly-digest cron) to record a milestone event in the user's
 * notification feed. It mirrors `bumpActivity`'s signature: pass `opts.tx` to
 * join a caller's `db.$transaction` (so the notification commits/rolls back
 * with the primary write — used by `verifyPayment` and `updateUser`), or omit
 * it to use the shared `db` client.
 *
 * Call sites fire it best-effort: `createNotification(...).catch(e => console.error(...))`
 * — a notification failure must never fail the user's primary action.
 *
 * Pure-ish: server-only. No `"use server"` directive — this is a library, not
 * an action module, so it can be imported by both `actions/*` and `lib/inngest/*`.
 */
import { db } from "@/lib/prisma";

/**
 * Create one notification row.
 *
 * @param {string} userId
 * @param {{ type: string, title: string, body?: string|null, href?: string|null, data?: any, tx?: any }} input
 * @returns {Promise<object>} the created notification
 */
export async function createNotification(userId, { type, title, body, href, data, tx }) {
  const client = tx ?? db;
  return client.notification.create({
    data: {
      userId,
      type,
      title,
      body: body ?? null,
      href: href ?? null,
      data: data ?? undefined,
    },
  });
}