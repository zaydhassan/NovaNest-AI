import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

/**
 * Syncs the signed-in Clerk user into our DB. Called from the SiteHeader
 * server component on every render, so it must NEVER throw — a thrown error
 * here aborts the entire Server Component render ("no message was provided").
 * On any failure it logs once and returns null; the auth boundary in the
 * protected routes (requireUser) still enforces sign-in where it matters.
 */
export const checkUser = async () => {
  let user;
  try {
    user = await currentUser();
  } catch (error) {
    console.error(
      "[NovaNest] checkUser: currentUser() failed:",
      error?.message || error
    );
    return null;
  }

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0]?.emailAddress,
      },
    });

    return newUser;
  } catch (error) {
    console.error("[NovaNest] checkUser sync failed:", error?.message || error);
    return null;
  }
};