import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Edge Function environment variables configured during `supabase secrets set`
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Determine the current date
    const today = new Date();
    
    // Exact intervals we want to target for warnings
    const targetIntervals = [14, 7, 1];
    
    let processedCount = 0;

    for (const daysLeft of targetIntervals) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysLeft);
      const targetDateString = targetDate.toISOString().split('T')[0];

      // Query database for matching drafts
      const { data: appeals, error } = await supabase
        .from('appeals')
        .select('id, patient_state, insurance_plan_type, deadline_date')
        .eq('deadline_date', targetDateString)
        .eq('status', 'Action Required');

      if (error) throw error;

      if (appeals && appeals.length > 0) {
        for (const appeal of appeals) {
          // Task 5.4: Connect Resend API to dispatch warnings
          const emailPayload = {
            from: "BillAuditor Alerts <onboarding@resend.dev>",
            to: ["admin@yourcompany.com"], // Would normally map to an assigned generic agent
            subject: `URGENT: ${daysLeft} days left to file appeal in ${appeal.patient_state}`,
            text: `The deadline for the ${appeal.insurance_plan_type} appeal is approaching on ${appeal.deadline_date}. \n\nPlease log in to the Dashboard and review the AI-drafted letter to ensure it is sent in time.`
          };

          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(emailPayload)
          });

          if (!resendResponse.ok) console.error("Resend delivery failed", await resendResponse.text());
          else processedCount++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, emailsDispatched: processedCount }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
