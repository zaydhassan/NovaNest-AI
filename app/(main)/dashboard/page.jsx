import { getIndustryInsights, getNovaScore } from "@/actions/dashboard";
import {
  getCareerHealth,
  getReadiness,
  getSkillGrowth,
  getRecentTimeline,
  getRecentCoachInsights,
  getCareerGoal,
} from "@/actions/career";
import { getApplications } from "@/actions/applications";
import { listChatSessions } from "@/actions/chat";
import { getTopics, recommendedTopics } from "@/actions/learning";
import DashboardView from "./_component/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const [
    insights,
    user,
    nova,
    careerHealth,
    readiness,
    skillGrowth,
    recentTimeline,
    coachInsights,
    applications,
    chatSessions,
    learningTopics,
    recommendations,
    goal,
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
    getRecentCoachInsights(6),
    getApplications(),
    listChatSessions({}),
    getTopics(),
    recommendedTopics(),
    getCareerGoal(),
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
      applications={applications}
      chatSessions={chatSessions}
      learningTopics={learningTopics}
      recommendations={recommendations}
      goal={goal}
    />
  );
}