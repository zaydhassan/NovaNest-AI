import { ensureOnboarded } from "@/lib/onboarding";
import { getTwin } from "@/actions/twin";
import { PageHeader } from "@/components/site/page-header";
import TwinView from "./_components/twin-view";

export const metadata = { title: "AI Career Twin" };

export default async function TwinPage() {
  await ensureOnboarded();
  const twin = await getTwin();

  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="Career OS"
        title="AI Career Twin"
        description="An AI model of you — built from everything NovaNest remembers. Ask it anything and it answers in your voice, grounded in your real history."
      />
      <TwinView initialTwin={twin} />
    </div>
  );
}