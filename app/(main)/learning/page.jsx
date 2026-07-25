import { ensureOnboarded } from "@/lib/onboarding";
import { getTopics, recommendedTopics } from "@/actions/learning";
import { getCareerGoal } from "@/actions/career";
import { PageHeader } from "@/components/site/page-header";
import LearningView from "./_components/learning-view";

export const metadata = { title: "Learning Engine" };

export default async function LearningPage() {
  await ensureOnboarded();
  const [topics, recommendations, goal] = await Promise.all([
    getTopics(),
    recommendedTopics(),
    getCareerGoal(),
  ]);

  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="Career OS"
        title="Learning Engine"
        description="Track the skills you're building, log practice sessions, and let NovaNest recommend your next move — grounded in your active career goal, industry, and mock-interview weaknesses."
      />
      <LearningView
        initialTopics={topics}
        initialRecommendations={recommendations}
        initialGoal={goal}
      />
    </div>
  );
}