import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { createNotification } from "./notifications";

// Neon (free tier) scales its compute to zero after ~5 min of inactivity.
// The first request after an idle window races Neon's wake-up (~2-3s) and can
// fail with a transient "Can't reach database server" error before the DB is
// ready. Retry the query once after a short delay so cold-start renders still
// sync the user instead of returning null.
const RETRY_DELAY_MS = 1500;
const isConnectionError = (error) => {
  if (!error) return false;
  if (error.name === "PrismaClientInitializationError") return true;
  const msg = String(error.message || error);
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("Timed out") ||
    msg.includes("Connection terminated")
  );
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  const findOrCreateUser = async () => {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return { user: loggedInUser, created: false };
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

    const created = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0]?.emailAddress,
      },
    });
    return { user: created, created: true };
  };

  try {
    let result;
    try {
      result = await findOrCreateUser();
    } catch (error) {
      if (!isConnectionError(error)) throw error;
      // Transient cold-start failure — give Neon a moment to wake, then retry.
      await sleep(RETRY_DELAY_MS);
      result = await findOrCreateUser();
    }

    const { user: dbUser, created } = result;

    if (created) {
      createNotification(dbUser.id, {
        type: "welcome",
        title: "Welcome to NovaNest 🎉",
        body: "Complete your profile to unlock industry insights, resume tools, and interview prep.",
        href: "/onboarding",
      }).catch((e) => console.error("[NovaNest] welcome notify:", e?.message));
    }

    return dbUser;
  } catch (error) {
    if (isConnectionError(error)) {
      console.warn(
        "[NovaNest] checkUser skipped (database unreachable after retry):",
        error?.message || error
      );
    } else {
      console.error("[NovaNest] checkUser sync failed:", error?.message || error);
    }
    return null;
  }
};