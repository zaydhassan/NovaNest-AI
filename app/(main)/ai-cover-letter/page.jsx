import { getCoverLetters } from "@/actions/cover-letter";
import { ensureOnboarded } from "@/lib/onboarding";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterList from "./_components/cover-letter-list";

export default async function CoverLetterPage() {
  await ensureOnboarded();
  const coverLetters = await getCoverLetters();

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="aurora-text animate-aurora text-4xl font-extrabold md:text-5xl">
            My Cover Letters
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and manage tailored cover letters for every application.
          </p>
        </div>
        <Link href="/ai-cover-letter/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create new
          </Button>
        </Link>
      </div>

      <CoverLetterList coverLetters={coverLetters} />
    </div>
  );
}