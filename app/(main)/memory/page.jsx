import { ensureOnboarded } from "@/lib/onboarding";
import {
  listStructuredMemories,
  countStructuredMemories,
} from "@/actions/memory-engine";
import { PageHeader } from "@/components/site/page-header";
import MemoryView from "./_component/memory-view";

export const metadata = { title: "Memory Engine" };

export default async function MemoryPage() {
  await ensureOnboarded();
  const [memories, counts] = await Promise.all([
    listStructuredMemories({}).catch(() => []),
    countStructuredMemories().catch(() => ({ byCategory: {}, total: 0 })),
  ]);

  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="Career OS"
        title="Memory Engine"
        description="The structured memories NovaNest retrieves to ground every AI response — projects, skills, achievements, certificates, preferences, resume versions, and lessons. Add what matters; the copilot pulls the relevant ones automatically."
      />
      <MemoryView initialMemories={memories ?? []} initialCounts={counts ?? { byCategory: {}, total: 0 }} />
    </div>
  );
}