import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { createNotification } from "./notifications";

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

    createNotification(newUser.id, {
      type: "welcome",
      title: "Welcome to NovaNest 🎉",
      body: "Complete your profile to unlock industry insights, resume tools, and interview prep.",
      href: "/onboarding",
    }).catch((e) => console.error("[NovaNest] welcome notify:", e?.message));

    return newUser;
  } catch (error) {
    console.error("[NovaNest] checkUser sync failed:", error?.message || error);
    return null;
  }
};