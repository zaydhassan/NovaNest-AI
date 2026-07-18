import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureOnboarded } from "@/lib/onboarding";
import { requireUser } from "@/lib/auth";
import VoiceMockInterview from "../_components/voice-mock-interview";

export const metadata = { title: "Voice Mock Interview" };

export default async function MockInterviewPage() {
  await ensureOnboarded();
  const user = await requireUser({ select: { industry: true } });

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
            Voice Mock Interview
          </h1>
          <p className="text-sm text-muted-foreground">
            Speak your answers out loud — the AI interviewer asks, you respond,
            and we score the conversation.
          </p>
        </div>
      </div>

      <VoiceMockInterview userIndustry={user.industry} />
    </div>
  );
}