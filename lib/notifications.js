import { db } from "@/lib/prisma";

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