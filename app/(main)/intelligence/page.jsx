import { ensureOnboarded } from "@/lib/onboarding";
import { PageHeader } from "@/components/site/page-header";
import { getIntelligence } from "@/actions/intelligence";
import IntelligenceView from "./_components/intelligence-view";

export const metadata = { title: "Career Intelligence" };

export default async function IntelligencePage() {
  await ensureOnboarded();

  const snapshot = await getIntelligence().catch(() => null);

  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="Career OS"
        title="Career Intelligence"
        description="Eight scores that explain where you stand, why, and what to do next — every number backed by evidence. No meaningless percentages, no opaque AI judgments: each score traces to the data points listed on its card."
      />
      <IntelligenceView snapshot={snapshot} />
    </div>
  );
}