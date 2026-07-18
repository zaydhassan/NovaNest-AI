/**
 * Auth boundary helpers for server actions.
 *
 * Replaces the repeated `auth() -> db.user.findUnique({ clerkUserId })`
 * boilerplate that was copy-pasted across every action file. All server
 * actions should resolve the current user through `requireUser()` so the
 * auth + DB lookup + error handling stays consistent.
 */
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { UnauthorizedError, UserNotFoundError } from "@/lib/errors";

/**
 * Resolve the Clerk-authenticated user into our DB user.
 * Throws `UnauthorizedError` if no Clerk session, `UserNotFoundError` if the
 * Clerk user has no DB row yet (the `checkUser` sync normally creates one).
 *
 * @param {{ include?: object, select?: object }} [opts]
 * @returns {Promise<import("@prisma/client").User & { _count?: any }>}
 */
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

/**
 * Resolve the user's Clerk id, throwing only if there is no session.
 * Used where the DB row isn't needed (e.g. middleware-adjacent checks).
 */
export async function requireClerkUserId() {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();
  return userId;
}