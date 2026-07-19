import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureOnboarded } from "@/lib/onboarding";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/site/page-header";
import VoiceMockInterview from "../_components/voice-mock-interview";

export const metadata = { title: "Voice Mock Interview" };

export default async function MockInterviewPage() {
  await ensureOnboarded();
  const user = await requireUser({ select: { industry: true } });

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
        title="Voice Mock Interview"
        description="Speak your answers out loud — the AI interviewer asks, you respond, and we score the conversation."
      />

      <VoiceMockInterview userIndustry={user.industry} />
    </div>
  );
}