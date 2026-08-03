import { Target } from "lucide-react";
import { ensureOnboarded } from "@/lib/onboarding";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/site/page-header";
import { DREAM_COMPANIES } from "@/lib/constants";
import { getDreamCompanyDashboard } from "@/actions/dream-company";
import DreamCompanyView from "./_components/dream-company-view";

export const metadata = { title: "Dream Company Mode" };

// Avoid a build-time Dynamic server usage error — this page reads the signed-in
// user and may generate AI content on demand.
export const dynamic = "force-dynamic";

export default async function DreamCompanyPage() {
  await ensureOnboarded();
  const user = await requireUser({ select: { targetCompany: true } });

  // Load the dashboard (company meta + profile + plan) when a target is set.
  // Best-effort: a failure falls back to the picker so the page never errors out.
  let dashboard = null;
  if (user.targetCompany) {
    try {
      dashboard = await getDreamCompanyDashboard();
    } catch (e) {
      console.error("[NovaNest] dream-company dashboard load:", e?.message);
      dashboard = null;
    }
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        eyebrow="Career OS"
        title="Dream Company Mode"
        description="Pick the company you're aiming for and every recommendation — interview prep, learning, projects, resume, skill gaps, salary, and application strategy — becomes personalized, with the AI explaining why."
      />
      <DreamCompanyView
        companies={DREAM_COMPANIES}
        selected={user.targetCompany}
        dashboard={dashboard}
      />
    </div>
  );
}