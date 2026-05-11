import { supabaseAdmin } from "@/lib/supabaseClient";
import { ExtractedLineItem } from "./geminiExtractionService";

export interface EvaluatedLineItem extends ExtractedLineItem {
    is_flagged: boolean;
    flag_reason: string | null;
    medicare_benchmark: number | null;
}

/**
 * Evaluates the extracted line items against the mocked CMS fee schedule.
 * Flags any items that charge >200% of the Medicare benchmark rate.
 * @param items The line items extracted from Gemini
 */
export async function auditLineItemsAgainstCMS(items: ExtractedLineItem[]): Promise<EvaluatedLineItem[]> {
    const evaluatedItems: EvaluatedLineItem[] = [];

    for (const item of items) {
        let is_flagged = false;
        let flag_reason: string | null = null;
        let medicare_benchmark: number | null = null;

        // Fetch the corresponding CPT code from the mock CMS table
        const { data: cmsData, error } = await supabaseAdmin
            .from('cms_fee_schedule')
            .select('medicare_rate')
            .eq('cpt_code', item.cpt_code)
            .single();

        if (error && error.code !== 'PGRST116') {
            // Log real DB errors (PGRST116 is no rows found)
            console.error(`Error fetching CMS data for ${item.cpt_code}:`, error.message);
        }

        if (cmsData) {
            medicare_benchmark = Number(cmsData.medicare_rate);
            
            // Check constraint: > 200% of Medicare rate
            if (item.charge > (medicare_benchmark * 2)) {
                is_flagged = true;
                flag_reason = `Overcharge: Billed $${item.charge.toFixed(2)}, which exceeds 200% of the Medicare benchmark rate ($${medicare_benchmark.toFixed(2)}).`;
            }
        }

        evaluatedItems.push({
            ...item,
            is_flagged,
            flag_reason,
            medicare_benchmark
        });
    }

    return evaluatedItems;
}
