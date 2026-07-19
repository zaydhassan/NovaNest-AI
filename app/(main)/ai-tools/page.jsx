import { ensureOnboarded } from "@/lib/onboarding";
import { PageHeader } from "@/components/site/page-header";
import AiTools from "./_components/ai-tools";

export const metadata = { title: "AI Tools" };

export default async function AiToolsPage() {
  await ensureOnboarded();
  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="AI toolkit"
        title="AI Career Tools"
        description="The extra edge — rewrite bullets, plan your upskilling, draft outreach, and score a job fit, all powered by NovaNest AI."
      />
      <AiTools />
    </div>
  );
}