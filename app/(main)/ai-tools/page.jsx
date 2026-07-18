import { ensureOnboarded } from "@/lib/onboarding";
import AiTools from "./_components/ai-tools";

export const metadata = { title: "AI Tools" };

export default async function AiToolsPage() {
  await ensureOnboarded();
  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="aurora-text animate-aurora text-4xl font-extrabold md:text-5xl">
          AI Career Tools
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The extra edge — rewrite bullets, plan your upskilling, draft
          outreach, and score a job fit, all powered by NovaNest AI.
        </p>
      </div>
      <AiTools />
    </div>
  );
}