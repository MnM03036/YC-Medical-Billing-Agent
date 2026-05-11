import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { appealFollowUpTracker, escalateAppeal } from "@/lib/inngest/functions";

// Next.js API route that Inngest uses to execute background jobs locally and in production
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    appealFollowUpTracker,
    escalateAppeal
  ],
});
