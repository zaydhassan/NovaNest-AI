import {
  listChatSessions,
} from "@/actions/chat";
import { getInsights, getSuggestedPrompts } from "@/actions/coach";
import CoachSurface from "./_components/coach-surface";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = { title: "AI Copilot" };

export default async function CoachPage() {
  const { isOnboarded } = await getUserOnboardingStatus();
  if (!isOnboarded) redirect("/onboarding");

  const [sessions, insights, suggestedPrompts] = await Promise.all([
    listChatSessions().catch(() => []),
    getInsights({ limit: 20 }).catch(() => []),
    getSuggestedPrompts().catch(() => []),
  ]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <CoachSurface
        initialSessions={sessions}
        initialInsights={insights}
        suggestedPrompts={suggestedPrompts}
      />
    </div>
  );
}