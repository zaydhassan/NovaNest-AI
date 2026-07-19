import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureOnboarded } from "@/lib/onboarding";
import { PageHeader } from "@/components/site/page-header";
import Quiz from "../_components/quiz";

export const metadata = { title: "Quiz Practice" };

export default async function QuizPage() {
  await ensureOnboarded();

  return (
    <div className="container mx-auto space-y-6 py-6">
      <Link href="/interview">
        <Button variant="link" className="gap-2 pl-0 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Interview Preparation
        </Button>
      </Link>

      <PageHeader
        eyebrow="Practice"
        title="Quiz Practice"
        description="Answer 10 role-specific multiple-choice questions and get instant scoring with an AI improvement tip."
      />

      <Quiz />
    </div>
  );
}