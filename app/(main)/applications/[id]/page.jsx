import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApplication } from "@/actions/applications";
import { getResume } from "@/actions/resume";
import { getCoverLetters } from "@/actions/cover-letter";
import { getMockInterviews } from "@/actions/mock-interview";
import { ensureOnboarded } from "@/lib/onboarding";
import ApplicationDetail from "../_components/application-detail";

export const metadata = { title: "Application" };

export default async function ApplicationDetailPage({ params }) {
  await ensureOnboarded();
  const { id } = await params;

  const application = await getApplication(id);

  const [resume, coverLetters, mocks] = await Promise.all([
    getResume(),
    getCoverLetters(),
    getMockInterviews(),
  ]);

  const roleKey = (application.role || "").toLowerCase();
  const relatedMocks = roleKey
    ? mocks.filter((m) => (m.role || "").toLowerCase().includes(roleKey)).slice(0, 5)
    : [];

  return (
    <div className="container mx-auto py-6">
      <Link href="/applications">
        <Button variant="link" className="gap-2 pl-0">
          <ArrowLeft className="h-4 w-4" />
          Back to pipeline
        </Button>
      </Link>

      <ApplicationDetail
        application={application}
        resume={resume}
        coverLetters={coverLetters}
        relatedMocks={relatedMocks}
      />
    </div>
  );
}