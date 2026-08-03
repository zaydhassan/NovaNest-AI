import { ensureOnboarded } from "@/lib/onboarding";
import { getTimeline } from "@/actions/timeline";
import { PageHeader } from "@/components/site/page-header";
import TimelineView from "./_component/timeline-view";

export const metadata = { title: "Career Timeline" };

export default async function TimelinePage() {
  await ensureOnboarded();

  // Pure read; newest-first. The client view filters/searches this set in
  // memory (no per-keystroke server round-trips). Up to 500 milestones — the
  // filter schema caps `limit` at 500. A transient DB hiccup renders an empty
  // timeline instead of a 500; the client re-fetches on sync.
  const events = await getTimeline({ limit: 500 }).catch(() => []);

  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="Career OS"
        title="Career Timeline"
        description="Every resume, application, interview, skill, certificate, project, offer, and rejection — auto-captured as a milestone. Search, filter, and watch your story build itself."
      />
      <TimelineView initialEvents={events ?? []} />
    </div>
  );
}