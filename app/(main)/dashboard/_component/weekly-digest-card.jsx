"use client";

import { format } from "date-fns";
import {
  Newspaper,
  TrendingUp,
  Target,
  HelpCircle,
  FileText,
  CheckSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Renders the user's latest weekly AI career digest. The digest is generated
 * by the Monday Inngest cron and stored as JSON; if none exists yet we show a
 * friendly empty state.
 */
export default function WeeklyDigestCard({ digest }) {
  const content = digest?.content;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
            <Newspaper className="h-4 w-4" />
          </span>
          Your weekly brief
        </CardTitle>
        <CardDescription>
          {digest?.weekStart
            ? `Week of ${format(new Date(digest.weekStart), "dd MMM yyyy")}`
            : "Your personalized Monday career digest"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!content ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Newspaper className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              No digest yet. Your first weekly brief generates automatically on
              Monday morning once you&apos;ve completed onboarding.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {content.headline && (
              <p className="text-sm font-medium">{content.headline}</p>
            )}

            {content.marketPulse && (
              <DigestRow icon={TrendingUp} label="Market pulse">
                {content.marketPulse}
              </DigestRow>
            )}

            {content.skillToWatch && (
              <DigestRow icon={Target} label="Skill to watch">
                <Badge variant="secondary" className="font-normal">
                  {content.skillToWatch}
                </Badge>
              </DigestRow>
            )}

            {content.practiceQuestion && (
              <DigestRow icon={HelpCircle} label="Practice question">
                {content.practiceQuestion}
              </DigestRow>
            )}

            {content.resumeTip && (
              <DigestRow icon={FileText} label="Resume tip">
                {content.resumeTip}
              </DigestRow>
            )}

            {content.actionItem && (
              <DigestRow icon={CheckSquare} label="Action this week">
                {content.actionItem}
              </DigestRow>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DigestRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}