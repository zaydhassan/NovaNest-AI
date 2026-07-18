import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import {
  generateIndustryInsights,
  generateWeeklyDigests,
} from "@/lib/inngest/function";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateIndustryInsights, generateWeeklyDigests],
});
