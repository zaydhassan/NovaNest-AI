import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { UnauthorizedError, UserNotFoundError } from "@/lib/errors";

export async function requireUser(opts = {}) {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    ...(opts.select ? { select: opts.select } : { include: opts.include }),
  });
  if (!user) throw new UserNotFoundError();

  return user;
}

export async function requireClerkUserId() {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();
  return userId;
}