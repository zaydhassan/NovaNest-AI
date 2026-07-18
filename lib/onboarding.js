import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

/**
 * Server-component guard for the authenticated app pages. Redirects to
 * /onboarding when the signed-in user hasn't completed profile setup, and to
 * /sign-in when there's no session. Returns the DB user when onboarded so the
 * page can use it without a second lookup.
 *
 * Used by /resume, /interview, /ai-cover-letter. (/dashboard already guards
 * itself via getUserOnboardingStatus + redirect.)
 */
export async function ensureOnboarded() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, industry: true, skills: true, experience: true, bio: true },
  });

  if (!user || !user.industry) redirect("/onboarding");
  return user;
}