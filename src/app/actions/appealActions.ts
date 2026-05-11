"use server";

import { determineApplicableLaw, ApplicableLaw } from "@/lib/legalRules";
import { classifyDenial, draftAppealLetter, DenialCategory } from "@/services/geminiDraftingService";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function generateAppealAction(billId: string, denialText: string, state: string, planType: string, patientName: string, insurer: string) {
    try {
        // 1. Determine Law
        const legalFramework = determineApplicableLaw(state, planType);
        
        // 2. Classify Denial
        const classification = await classifyDenial(denialText);
        
        // 3. Draft Letter
        const draftMarkdown = await draftAppealLetter(
            billId,
            legalFramework.law,
            classification,
            { state, name: patientName, insurer }
        );

        // 4. Save to DB
        const { data, error } = await supabaseAdmin.from('appeals').upsert({
            bill_id: billId,
            status: 'draft',
            deadline_date: new Date(Date.now() + legalFramework.statutory_deadline_days * 24 * 60 * 60 * 1000).toISOString(),
            ai_generated_appeal_draft: draftMarkdown,
            patient_state: state,
            insurance_plan_type: planType,
            raw_denial_text: denialText
        }).select().single();

        if (error) throw new Error("Database insertion failed: " + error.message);

        return { success: true, appealId: data.id, draft: draftMarkdown, deadline: data.deadline_date };
    } catch (error: any) {
        console.error("Failed to generate appeal:", error);
        return { success: false, error: error.message };
    }
}
