"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { markNotificationReadSchema } from "@/lib/schemas";
import { ValidationError } from "@/lib/errors";
import { revalidatePath } from "next/cache";

/**
 * Fetch the signed-in user's notifications, newest first. `unreadOnly` filters
 * to unread (used by the bell badge / "Unread" tab). `limit` caps the result —
 * the bell dropdown asks for a small slice, the full page asks for more.
 */
export async function getNotifications({ limit = 20, unreadOnly = false } = {}) {
  const user = await requireUser({ select: { id: true } });

  return db.notification.findMany({
    where: {
      userId: user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
}

/**
 * Unread count for the header bell badge. Cheap `count` query; called from the
 * SiteHeader server component via `db` directly too, but exposed here so client
 * islands can refresh after marking read.
 */
export async function getUnreadNotificationCount() {
  const user = await requireUser({ select: { id: true } });
  return db.notification.count({
    where: { userId: user.id, isRead: false },
  });
}

/**
 * Mark a single notification as read. Scoped to the signed-in user via
 * `updateMany` + `userId` so a forged id from another user is a no-op.
 */
export async function markNotificationRead(id) {
  const user = await requireUser({ select: { id: true } });

  const parsed = markNotificationReadSchema.safeParse({ id });
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues?.[0]?.message ?? "Invalid notification.");
  }

  await db.notification.updateMany({
    where: { id: parsed.data.id, userId: user.id },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
  revalidatePath("/");
  return { success: true };
}

/**
 * Mark every unread notification for the signed-in user as read.
 */
export async function markAllNotificationsRead() {
  const user = await requireUser({ select: { id: true } });

  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
  revalidatePath("/");
  return { success: true };
}