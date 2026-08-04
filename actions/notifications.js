"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { markNotificationReadSchema } from "@/lib/schemas";
import { ValidationError } from "@/lib/errors";
import { revalidatePath } from "next/cache";

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

export async function getUnreadNotificationCount() {
  const user = await requireUser({ select: { id: true } });
  return db.notification.count({
    where: { userId: user.id, isRead: false },
  });
}

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