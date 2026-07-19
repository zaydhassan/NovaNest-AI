import Link from "next/link";
import { Mic, ListChecks } from "lucide-react";
import { getAssessments } from "@/actions/interview";
import { ensureOnboarded } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/page-header";
import StatsCards from "./_components/stats-cards";
import PerformanceChart from "./_components/performace-chart";
import QuizList from "./_components/quiz-list";

export default async function InterviewPrepPage() {
  await ensureOnboarded();
  const assessments = await getAssessments();

  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="Practice"
        title="Interview Preparation"
        description="Practice role-specific questions and track your progress over time."
        actions={
          <>
            <Button asChild variant="gradient" className="gap-2">
              <Link href="/interview/quiz">
                <ListChecks className="h-4 w-4" />
                Quick Quiz
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/interview/mock">
                <Mic className="h-4 w-4" />
                Voice Mock Interview
              </Link>
            </Button>
          </>
        }
      />
      <div className="space-y-6">
        <StatsCards assessments={assessments} />
        <PerformanceChart assessments={assessments} />
        <QuizList assessments={assessments} />
      </div>
    </div>
  );
}