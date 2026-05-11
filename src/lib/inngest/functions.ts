import { inngest } from "./client";
import { supabaseAdmin } from "../supabaseClient";

async function checkAppealStatus(appealId: string) {
    const { data } = await supabaseAdmin.from("appeals").select("status").eq("id", appealId).single();
    return data?.status;
}

export const appealFollowUpTracker = inngest.createFunction(
  { id: "appeal-follow-up", retries: 3 },
  { event: "appeal/sent" },
  async ({ event, step }) => {
    
    // Wait exactly 30 days
    await step.sleep("wait-30-days", "30d");
    
    // Check DB status via step.run to ensure idempotency
    const status = await step.run("check-status", async () => {
      return await checkAppealStatus(event.data.appealId);
    });

    if (status !== 'resolved' && status !== 'resolved_won') {
        await step.sendEvent("escalate", { 
            name: "appeal/escalate", 
            data: { appealId: event.data.appealId } 
        });
    }
  }
);

export const escalateAppeal = inngest.createFunction(
    { id: "escalate-appeal" },
    { event: "appeal/escalate" },
    async ({ event, step }) => {
        await step.run("log-escalation", async () => {
             // In a real application, you would generate a CFPB or State Regulator complaint here using Gemini
             // and dispatch it via Lob to the state authority.
             await supabaseAdmin.from('audit_logs').insert({ action: 'escalated_to_state', user_id: "system" });
             await supabaseAdmin.from('appeals').update({ status: 'escalated' }).eq('id', event.data.appealId);
        });
    }
);
