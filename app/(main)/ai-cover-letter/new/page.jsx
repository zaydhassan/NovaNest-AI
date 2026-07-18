import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureOnboarded } from "@/lib/onboarding";
import CoverLetterGenerator from "../_components/cover-letter-generator";

export default async function NewCoverLetterPage() {
  await ensureOnboarded();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <Link href="/ai-cover-letter">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>

        <div className="pb-6">
          <h1 className="aurora-text animate-aurora text-4xl font-extrabold md:text-5xl">
            Create Cover Letter
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a tailored cover letter for your job application
          </p>
        </div>
      </div>

      <CoverLetterGenerator />
    </div>
  );
}