import { getIndustryInsights, getNovaScore } from "@/actions/dashboard";
import {
  getCareerHealth,
  getReadiness,
  getSkillGrowth,
  getRecentTimeline,
  getRecentCoachInsights,
} from "@/actions/career";
import DashboardView from "./_component/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  // Run insight resolution, the user lookup, the NovaScore, and the Career OS
  // dashboard payloads in parallel — one round trip per surface.
  const [
    insights,
    user,
    nova,
    careerHealth,
    readiness,
    skillGrowth,
    recentTimeline,
    coachInsights,
  ] = await Promise.all([
    getIndustryInsights(),
    requireUser({
      select: {
        skills: true,
        plan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
      },
    }),
    getNovaScore(),
    getCareerHealth(),
    getReadiness(),
    getSkillGrowth(),
    getRecentTimeline(6),
    getRecentCoachInsights(4),
  ]);

  return (
    <DashboardView
      insights={insights}
      userSkills={user.skills ?? []}
      nova={nova}
      planInfo={{
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        currentPeriodEnd: user.currentPeriodEnd,
      }}
      careerHealth={careerHealth}
      readiness={readiness}
      skillGrowth={skillGrowth}
      recentTimeline={recentTimeline}
      coachInsights={coachInsights}
    />
  );
}