import { getIndustryInsights, getNovaScore } from "@/actions/dashboard";
import DashboardView from "./_component/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  // Run insight resolution, the user lookup, and the NovaScore in parallel.
  const [insights, user, nova] = await Promise.all([
    getIndustryInsights(),
    requireUser({ select: { skills: true } }),
    getNovaScore(),
  ]);

  return <DashboardView insights={insights} userSkills={user.skills ?? []} nova={nova} />;
}