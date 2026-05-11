export enum ApplicableLaw {
    NO_SURPRISES_ACT = "No Surprises Act",
    ERISA = "ERISA Section 503",
    STATE_LAW = "State Department of Insurance Law",
    MEDICARE_RULES = "Medicare Appeals Process",
    UNKNOWN = "General Grievance Protocol"
}

export interface LegalFramework {
    law: ApplicableLaw;
    statutory_deadline_days: number;
}

/**
 * Rules Engine mapping to determine the legal framework for the appeal.
 */
export function determineApplicableLaw(state: string, plan_type: string): LegalFramework {
    const pt = plan_type.toUpperCase();
    
    if (pt.includes("OON") || pt.includes("SURPRISE")) {
        // Federal No Surprises Act covers out of network emergency or unauthorized services
        return { law: ApplicableLaw.NO_SURPRISES_ACT, statutory_deadline_days: 30 };
    }
    
    if (pt.includes("ERISA") || pt.includes("SELF-FUNDED")) {
        // ERISA governs self-funded employer plans across all states (federal preemption)
        return { law: ApplicableLaw.ERISA, statutory_deadline_days: 180 };
    }
    
    if (pt.includes("MEDICARE") || pt.includes("MEDICAID")) {
        return { law: ApplicableLaw.MEDICARE_RULES, statutory_deadline_days: 120 };
    }

    if (pt.includes("ACA") || pt.includes("MARKETPLACE")) {
        // State-regulated commercial laws apply to fully-insured marketplace plans
        return { law: ApplicableLaw.STATE_LAW, statutory_deadline_days: 180 };
    }

    return { law: ApplicableLaw.UNKNOWN, statutory_deadline_days: 30 };
}
