import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureOnboarded } from "@/lib/onboarding";
import Quiz from "../_components/quiz";

export const metadata = { title: "Quiz Practice" };

export default async function QuizPage() {
  await ensureOnboarded();

  return (
    <div className="container mx-auto space-y-4 py-6">
      <div className="flex flex-col space-y-2">
        <Link href="/interview">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Interview Preparation
          </Button>
        </Link>

        <div>
          <h1 className="aurora-text animate-aurora text-4xl font-extrabold md:text-5xl">
            Quiz Practice
          </h1>
          <p className="text-sm text-muted-foreground">
            Answer 10 role-specific multiple-choice questions and get instant
            scoring with an AI improvement tip.
          </p>
        </div>
      </div>

      <Quiz />
    </div>
  );
}