import { getCoverLetters } from "@/actions/cover-letter";
import { ensureOnboarded } from "@/lib/onboarding";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/page-header";
import CoverLetterList from "./_components/cover-letter-list";

export default async function CoverLetterPage() {
  await ensureOnboarded();
  const coverLetters = await getCoverLetters();

  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="Cover letters"
        title="My Cover Letters"
        description="Generate and manage tailored cover letters for every application."
        actions={
          <Link href="/ai-cover-letter/new">
            <Button variant="gradient" className="gap-2">
              <Plus className="h-4 w-4" />
              Create new
            </Button>
          </Link>
        }
      />

      <CoverLetterList coverLetters={coverLetters} />
    </div>
  );
}