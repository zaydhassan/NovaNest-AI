import { ensureOnboarded } from "@/lib/onboarding";
import { getApplications } from "@/actions/applications";
import ApplicationBoard from "./_components/application-board";

export const metadata = { title: "Application Tracker" };

export default async function ApplicationsPage() {
  await ensureOnboarded();
  const applications = await getApplications();

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="aurora-text animate-aurora text-4xl font-extrabold md:text-5xl">
            Application Tracker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your job pipeline — saved, applied, interviewing, offers. Drag
            cards between columns or edit to update status.
          </p>
        </div>
      </div>
      <ApplicationBoard initialApplications={applications} />
    </div>
  );
}