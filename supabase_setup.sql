-- Run this entirely in the Supabase SQL Editor

-- 1. Create Legal Frameworks lookup table
CREATE TABLE legal_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(50) NOT NULL,
    plan_type VARCHAR(100) NOT NULL,
    applicable_law VARCHAR(255) NOT NULL,
    statutory_deadline_days INT NOT NULL,
    template_structure TEXT
);

-- Seed constraints
ALTER TABLE legal_frameworks ADD CONSTRAINT unique_law_mapping UNIQUE (state, plan_type);

-- PHASE 2 Seed Mappings
INSERT INTO legal_frameworks (state, plan_type, applicable_law, statutory_deadline_days, template_structure)
VALUES 
('CA', 'Employer (Self-Funded/ERISA)', 'ERISA Section 503', 180, 'Under ERISA Section 503, the plan administrator must...'),
('NY', 'Employer (Self-Funded/ERISA)', 'ERISA Section 503', 180, 'Under ERISA Section 503, the plan administrator must...'),
('TX', 'Employer (Self-Funded/ERISA)', 'ERISA Section 503', 180, 'Under ERISA Section 503, the plan administrator must...'),
('FL', 'Employer (Self-Funded/ERISA)', 'ERISA Section 503', 180, 'Under ERISA Section 503, the plan administrator must...'),
('CA', 'Surprise Billing (OON)', 'No Surprises Act / CA AB 72', 30, 'Pursuant to the No Surprises Act and CA AB 72, out of network billing for this emergency service is prohibited...'),
('NY', 'Surprise Billing (OON)', 'No Surprises Act / NY Out-of-Network Law', 30, 'Pursuant to the No Surprises Act and NY Financial Services Law Article 6, out of network billing...'),
('TX', 'Surprise Billing (OON)', 'No Surprises Act / TX SB 1264', 30, 'Pursuant to the No Surprises Act and TX SB 1264...'),
('FL', 'Surprise Billing (OON)', 'No Surprises Act / FL HB 221', 30, 'Pursuant to the No Surprises Act and FL HB 221...'),
('CA', 'ACA Marketplace', 'CA Dept of Managed Health Care (DMHC)', 180, 'Under CA DMHC regulations governing standard essential health benefits...'),
('NY', 'ACA Marketplace', 'NY Dept of Financial Services (DFS)', 180, 'Under NY DFS state-regulated commercial laws...'),
('TX', 'ACA Marketplace', 'TX Dept of Insurance (TDI)', 180, 'Under TX TDI state-regulated standards...'),
('FL', 'ACA Marketplace', 'FL Office of Insurance Regulation (OIR)', 180, 'Under FL OIR rules...'),
('CA', 'Medicare / Medicaid', 'Medicare Appeals Process / Medi-Cal Rules', 120, 'Under Medicare Part B appeals process limitations...'),
('NY', 'Medicare / Medicaid', 'Medicare Appeals Process / Medicaid Rules', 120, 'Under Medicare Part B...'),
('TX', 'Medicare / Medicaid', 'Medicare Appeals Process / Texas Medicaid Rules', 120, 'Under Medicare Part B...'),
('FL', 'Medicare / Medicaid', 'Medicare Appeals Process / Florida Medicaid Rules', 120, 'Under Medicare Part B...');
ON CONFLICT (state, plan_type) DO NOTHING;

-- 2. Create Appeals table
CREATE TABLE appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    patient_state VARCHAR(50),
    insurance_plan_type VARCHAR(100),
    denial_date DATE,
    raw_denial_text TEXT,
    deadline_date DATE,
    legal_framework_id UUID REFERENCES legal_frameworks(id),
    ai_generated_appeal_draft TEXT,
    status VARCHAR(50) DEFAULT 'Draft' -- Draft, Action Required, Sent
);

-- 3. Create Denial Classifications table/type
CREATE TYPE denial_reason_type AS ENUM ('MEDICAL_NECESSITY', 'OUT_OF_NETWORK', 'CODING_ERROR', 'PRIOR_AUTH_MISSING', 'UNKNOWN');

CREATE TABLE denial_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appeal_id UUID REFERENCES appeals(id) ON DELETE CASCADE,
    classified_reason denial_reason_type,
    confidence_score FLOAT,
    ai_rationale TEXT,
    manual_review_required BOOLEAN DEFAULT FALSE
);

-- Note: RLS (Row Level Security) policies are currently not specified for rapid MVP prototyping.
-- Make sure to set `appeals` and `legal_frameworks` to allow anonymous POST operations via the Supabase Dashboard,
-- OR strictly interact with Supabase via Node.js Server-Side APIs avoiding client-side inserts.
