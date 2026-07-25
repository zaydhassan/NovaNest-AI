import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import {
  generateIndustryInsights,
  generateWeeklyDigests,
  backfillCareerTimeline,
  analyzeGitHubRepo,
  rebuildCareerTwin,
  weeklyCoachDigest,
  scoreResumeAgainstIndustry,
  extractMemoriesFromSource,
} from "@/lib/inngest/function";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateIndustryInsights,
    generateWeeklyDigests,
    backfillCareerTimeline,
    analyzeGitHubRepo,
    rebuildCareerTwin,
    weeklyCoachDigest,
    scoreResumeAgainstIndustry,
    extractMemoriesFromSource,
  ],
});