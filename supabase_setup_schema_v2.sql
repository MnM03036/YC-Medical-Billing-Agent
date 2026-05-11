-- Phase 1 Schema additions
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    state VARCHAR(50),
    plan_type VARCHAR(100),
    stripe_customer_id VARCHAR(255)
);

CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, audited, appealed, resolved
    total_amount NUMERIC(10, 2),
    upload_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    cpt_code VARCHAR(20),
    description TEXT,
    provider VARCHAR(255),
    charge_amount NUMERIC(10, 2),
    date_of_service DATE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT
);

CREATE TABLE cms_fee_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpt_code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    medicare_rate NUMERIC(10, 2) NOT NULL
);

-- Seed mock CMS data for testing
INSERT INTO cms_fee_schedule (cpt_code, description, medicare_rate) VALUES
('99213', 'Office/Outpatient Visit, Level 3', 90.00),
('99214', 'Office/Outpatient Visit, Level 4', 130.00),
('80053', 'Comprehensive Metabolic Panel', 15.00),
('93000', 'Electrocardiogram, complete', 18.00),
('99283', 'Emergency Dept Visit, Level 3', 175.00)
ON CONFLICT (cpt_code) DO UPDATE SET medicare_rate = EXCLUDED.medicare_rate;

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Altering existing appeals table to match new required state
ALTER TABLE appeals
ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES bills(id),
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS text_content TEXT;
