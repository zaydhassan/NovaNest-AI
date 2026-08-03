import { getResume } from "@/actions/resume";
import { ensureOnboarded } from "@/lib/onboarding";
import ResumeBuilder from "./_components/resume-builder";

export const metadata = { title: "Resume Builder" };

export default async function ResumePage() {
  await ensureOnboarded();
  const resume = await getResume();

  return (
    <div className="container mx-auto py-6">
      <ResumeBuilder initialContent={resume?.content} />
    </div>
  );
}