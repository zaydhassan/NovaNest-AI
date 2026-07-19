import { ensureOnboarded } from "@/lib/onboarding";
import { getApplications } from "@/actions/applications";
import { PageHeader } from "@/components/site/page-header";
import ApplicationBoard from "./_components/application-board";

export const metadata = { title: "Application Tracker" };

export default async function ApplicationsPage() {
  await ensureOnboarded();
  const applications = await getApplications();

  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="Pipeline"
        title="Application Tracker"
        description="Manage your job pipeline — saved, applied, interviewing, offers. Drag cards between columns or edit to update status."
      />
      <ApplicationBoard initialApplications={applications} />
    </div>
  );
}