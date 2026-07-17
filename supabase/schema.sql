-- ============================================================
-- APTIV BOOKKEEPING CRM — SUPABASE SCHEMA
-- South Africa Edition
-- Regulatory Compliance:
--   • SARB (South African Reserve Bank) — prudential oversight
--   • FICA (Financial Intelligence Centre Act) — AML/KYC
--   • CBDA (Co-operative Banks Development Agency) — co-op bank registration & prudential standards
--   • FSCA (Financial Sector Conduct Authority) — market conduct
--   • SARS (South African Revenue Service) — tax
--   • POPIA (Protection of Personal Information Act)
-- Currency: ZAR (South African Rand)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ab_members  (CRM Core — FICA compliant)
-- FICA (Financial Intelligence Centre Act) KYC/CDD requirements
-- ============================================================
CREATE TABLE ab_members (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_number          TEXT UNIQUE NOT NULL,          -- e.g. RC-2026-015
  -- Personal Identification
  first_name             TEXT NOT NULL,
  last_name              TEXT NOT NULL,
  date_of_birth          DATE,                          -- auto-derived from sa_id_number where possible
  gender                 TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  nationality             TEXT DEFAULT 'South African',
  -- SA ID Documents (FICA — at least one required)
  sa_id_number           TEXT,                          -- 13-digit South African ID number (Luhn-validated)
  passport_number        TEXT,                          -- Passport (foreign nationals without an SA ID)
  sars_tax_number        TEXT,                          -- SARS Income Tax Reference Number
  -- Contact
  phone                  TEXT NOT NULL,                 -- 27XXXXXXXXX format
  email                  TEXT,
  physical_address       TEXT,
  province                TEXT,                          -- South African province
  postal_address         TEXT,
  -- Co-operative Bank Membership
  share_capital          BIGINT DEFAULT 0,              -- ZAR (stored in cents)
  savings_balance        BIGINT DEFAULT 0,              -- ZAR (stored in cents)
  loan_balance           BIGINT DEFAULT 0,              -- ZAR (stored in cents)
  cbda_reg_number        TEXT,                          -- Co-operative Banks Development Agency
  -- FICA Status
  fica_status            TEXT NOT NULL DEFAULT 'None'
                         CHECK (fica_status IN ('Verified', 'Incomplete', 'None')),
  fica_verified_date     DATE,
  fica_verified_by       UUID,
  fica_doc_id_verified   BOOLEAN DEFAULT FALSE,         -- ID document verified
  fica_doc_address_verified BOOLEAN DEFAULT FALSE,      -- Proof of address verified
  fica_doc_income_verified  BOOLEAN DEFAULT FALSE,       -- Source of funds verified
  -- AML Risk Rating (FICA)
  aml_risk_rating        TEXT NOT NULL DEFAULT 'Low'
                         CHECK (aml_risk_rating IN ('Low', 'Medium', 'High', 'Very High')),
  aml_pep_status         BOOLEAN DEFAULT FALSE,         -- Politically Exposed Person
  aml_sanctions_checked  BOOLEAN DEFAULT FALSE,         -- UN/OFAC/AU sanctions check
  aml_sanctions_date     DATE,
  -- Source of Funds (FIC Act s21)
  source_of_funds        TEXT,
  source_of_funds_docs   BOOLEAN DEFAULT FALSE,
  -- CBDA-specific (for co-operative bank members)
  cbda_member_class      TEXT CHECK (cbda_member_class IN ('Individual', 'Corporate', 'Institutional', 'Youth', NULL)),
  cbda_admission_date    DATE,
  -- Member Status
  status                 TEXT NOT NULL DEFAULT 'Active'
                         CHECK (status IN ('Active', 'Dormant', 'Exited')),
  member_type            TEXT NOT NULL DEFAULT 'Individual'
                         CHECK (member_type IN ('Individual', 'Corporate', 'Co-operative', 'Partnership', 'NGO')),
  -- Bookkeeping Bridge
  bookkeeping_member_id  UUID,                          -- Linked Roots Books member ID
  bridge_synced          BOOLEAN DEFAULT FALSE,
  bridge_last_sync       TIMESTAMPTZ,
  -- Metadata
  onboarded_by           UUID,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ab_fica_documents (FICA document tracking)
-- ============================================================
CREATE TABLE ab_fica_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id       UUID NOT NULL REFERENCES ab_members(id) ON DELETE CASCADE,
  doc_type        TEXT NOT NULL CHECK (doc_type IN (
                    'SA ID', 'Passport', 'SARS Tax Number',
                    'Utility Bill', 'Bank Statement', 'Pay Slip',
                    'Business Registration', 'Co-op Certificate', 'Other')),
  doc_reference   TEXT,
  doc_number      TEXT,
  issue_date      DATE,
  expiry_date     DATE,
  verified        BOOLEAN DEFAULT FALSE,
  verified_by     UUID,
  verified_date   DATE,
  storage_url     TEXT,                                  -- Supabase Storage path
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. ab_payment_transactions (generic payment gateway integration)
-- All amounts in ZAR (stored as integer cents)
-- ============================================================
CREATE TABLE ab_payment_transactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id             UUID REFERENCES ab_members(id) ON DELETE SET NULL,
  member_name           TEXT,
  -- Generic gateway fields
  gateway_request_id    TEXT,                            -- push-payment/hosted-request identifier
  gateway_reference     TEXT UNIQUE,                     -- settlement/receipt reference
  payer_reference       TEXT,                            -- phone, masked card, or bank ref depending on rail
  amount_zar            BIGINT NOT NULL,                 -- ZAR in cents
  transaction_type      TEXT NOT NULL DEFAULT 'Instant EFT'
                        CHECK (transaction_type IN ('Payment Request', 'Card Payment', 'Instant EFT', 'Payout', 'Refund')),
  transaction_date      TIMESTAMPTZ,
  gateway_result_code   TEXT,
  gateway_result_desc   TEXT,
  status                TEXT NOT NULL DEFAULT 'Pending'
                        CHECK (status IN ('Pending', 'Completed', 'Failed', 'Reversed', 'Queried')),
  -- Bookkeeping sync
  bookkeeping_tx_id     UUID,                            -- Linked Roots Books tx ID
  bookkeeping_synced    BOOLEAN DEFAULT FALSE,
  -- FICA flag (R10,000.00 cash threshold — FIC Act s28)
  fica_flag             BOOLEAN DEFAULT FALSE,
  -- Metadata
  narrative             TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ab_compliance_flags (SA regulatory — FICA, SARB, CBDA, FSCA)
-- ============================================================
CREATE TABLE ab_compliance_flags (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id           UUID REFERENCES ab_members(id) ON DELETE SET NULL,
  member_name         TEXT,
  payment_tx_id       UUID REFERENCES ab_payment_transactions(id) ON DELETE SET NULL,
  severity            TEXT NOT NULL CHECK (severity IN ('HIGH', 'MEDIUM', 'LOW')),
  flag_type           TEXT NOT NULL,
  description         TEXT NOT NULL,
  -- Regulatory reference
  regulatory_body     TEXT CHECK (regulatory_body IN ('FICA', 'SARB', 'CBDA', 'FSCA', 'SARS', 'POPIA', 'Internal')),
  regulatory_ref      TEXT,                             -- e.g. "FIC Act s28(1)"
  -- Reporting obligation
  str_required        BOOLEAN DEFAULT FALSE,            -- Suspicious Transaction Report to FIC
  str_filed           BOOLEAN DEFAULT FALSE,
  str_filed_date      DATE,
  str_reference       TEXT,
  -- Status
  status              TEXT NOT NULL DEFAULT 'Open'
                      CHECK (status IN ('Open', 'In Review', 'Escalated', 'STR Filed', 'Resolved', 'False Positive')),
  detected_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  assigned_to         UUID,
  resolved_date       DATE,
  resolution_notes    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. ab_accounts (South African Chart of Accounts — IFRS for SMEs)
-- Primary 18 accounts aligned to Roots Books' trial balance,
-- plus supplementary accounts preserving broader coverage.
-- ============================================================
CREATE TABLE ab_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
  sub_category    TEXT,
  normal_balance  TEXT NOT NULL CHECK (normal_balance IN ('Debit', 'Credit')),
  balance         BIGINT NOT NULL DEFAULT 0,            -- ZAR cents
  is_active       BOOLEAN DEFAULT TRUE,
  standard_ref    TEXT,                                 -- IAS/IFRS or CBDA standard reference
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. ab_transactions (Bookkeeping ledger — ZAR)
-- ============================================================
CREATE TABLE ab_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  member_id       UUID REFERENCES ab_members(id) ON DELETE SET NULL,
  member_name     TEXT,
  type            TEXT NOT NULL CHECK (type IN (
                    'Deposit', 'Withdrawal', 'Loan Disbursement', 'Loan Repayment',
                    'Fee', 'Interest', 'Share Purchase', 'Dividend')),
  amount_zar      BIGINT NOT NULL CHECK (amount_zar > 0), -- ZAR cents
  account_code    TEXT NOT NULL,
  description     TEXT,
  reference       TEXT NOT NULL,
  gateway_reference TEXT,                               -- if payment-gateway sourced
  status          TEXT NOT NULL DEFAULT 'Posted'
                  CHECK (status IN ('Posted', 'Pending', 'Reversed')),
  fica_flag       BOOLEAN DEFAULT FALSE,                -- >=R10,000.00 triggers FICA review (FIC Act s28)
  reconciled      BOOLEAN DEFAULT FALSE,
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. ab_journal_entries (Double-entry — IFRS for SMEs)
-- ============================================================
CREATE TABLE ab_journal_entries (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference    TEXT UNIQUE NOT NULL,
  entry_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  description  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'Draft'
               CHECK (status IN ('Draft', 'Posted', 'Reversed')),
  reversed_by  UUID,
  reversal_date DATE,
  reversal_notes TEXT,
  created_by   UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. ab_journal_lines
-- ============================================================
CREATE TABLE ab_journal_lines (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id  UUID NOT NULL REFERENCES ab_journal_entries(id) ON DELETE CASCADE,
  account_code      TEXT NOT NULL,
  account_name      TEXT NOT NULL,
  debit_zar         BIGINT NOT NULL DEFAULT 0 CHECK (debit_zar >= 0),
  credit_zar        BIGINT NOT NULL DEFAULT 0 CHECK (credit_zar >= 0),
  description       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. ab_reconciliations (Bank recon — bank vs book balance)
-- ============================================================
CREATE TABLE ab_reconciliations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period                TEXT NOT NULL,
  bank_balance_zar      BIGINT,
  book_balance_zar      BIGINT,
  variance_zar          BIGINT,
  status                TEXT NOT NULL DEFAULT 'In Progress'
                        CHECK (status IN ('In Progress', 'Completed', 'Disputed')),
  unreconciled_items    INT DEFAULT 0,
  notes                 TEXT,
  completed_by          TEXT,
  completed_date        DATE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. ab_cbda_reports (CBDA prudential returns)
-- NOTE: the 10%/15%/70%/25% ratio minimums below are placeholder
-- figures carried over from the Kenya edition's SASSRA rules — they
-- are NOT verified CBDA prudential minimums. Confirm actual CBDA
-- Prudential Standards figures before relying on these in production.
-- ============================================================
CREATE TABLE ab_cbda_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type     TEXT NOT NULL CHECK (report_type IN (
                    'Monthly Returns', 'Quarterly Prudential', 'Annual Audited',
                    'Liquidity Ratio', 'Capital Adequacy', 'Loan Portfolio')),
  period          TEXT NOT NULL,                        -- e.g. "2026-Q1"
  due_date        DATE NOT NULL,
  submitted_date  DATE,
  status          TEXT NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending', 'Prepared', 'Submitted', 'Accepted', 'Queried', 'Overdue')),
  -- Key ratios (illustrative — see note above)
  capital_adequacy_ratio  NUMERIC(5,2),                 -- illustrative min 10%
  liquidity_ratio         NUMERIC(5,2),                 -- illustrative min 15%
  loan_to_asset_ratio     NUMERIC(5,2),                 -- illustrative max 70%
  external_borrowing_ratio NUMERIC(5,2),                -- illustrative max 25%
  total_assets_zar        BIGINT,
  total_deposits_zar      BIGINT,
  total_loans_zar         BIGINT,
  total_equity_zar        BIGINT,
  notes           TEXT,
  prepared_by     UUID,
  submitted_by    UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. ab_coop_register (CBDA co-operative bank member register)
-- ============================================================
CREATE TABLE ab_coop_register (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id             UUID NOT NULL REFERENCES ab_members(id) ON DELETE CASCADE,
  member_number         TEXT UNIQUE NOT NULL,
  admission_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  share_capital_zar     BIGINT NOT NULL DEFAULT 0,      -- ZAR cents
  shares_held           INTEGER DEFAULT 0,
  share_value_zar       BIGINT DEFAULT 100000,          -- ZAR 1,000 per share (cents)
  dividend_entitlement  BIGINT DEFAULT 0,
  loan_exposure_zar     BIGINT DEFAULT 0,
  member_class          TEXT NOT NULL DEFAULT 'Regular'
                        CHECK (member_class IN ('Regular', 'Associate', 'Institutional', 'Youth', 'Deceased')),
  exit_date             DATE,
  exit_reason           TEXT,
  -- AGM voting rights
  agm_eligible          BOOLEAN DEFAULT TRUE,
  agm_last_attended     DATE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. ab_users
-- ============================================================
CREATE TABLE ab_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id  UUID UNIQUE,
  email         TEXT UNIQUE NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'Viewer'
                CHECK (role IN ('Admin', 'COO', 'Compliance Officer', 'Viewer')),
  status        TEXT NOT NULL DEFAULT 'Active'
                CHECK (status IN ('Active', 'Inactive', 'Pending')),
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. ab_settings (South Africa org config)
-- ============================================================
CREATE TABLE ab_settings (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_name                    TEXT NOT NULL DEFAULT 'SA Aptiv Bookkeeping CRM',
  registration_number         TEXT,                     -- Companies Act / co-op bank registration
  sarb_cfi_licence            TEXT,                     -- South African Reserve Bank CFI licence
  cbda_registration           TEXT,                     -- Co-operative Banks Development Agency registration
  vat_number                  TEXT,                     -- VAT registration
  province                    TEXT,                     -- South African province of registration
  address                     TEXT,
  phone                       TEXT,
  email                       TEXT,
  financial_year_end          TEXT NOT NULL DEFAULT '28 February'
                              CHECK (financial_year_end IN ('28 February', '31 March', '30 June')),
  currency                    TEXT DEFAULT 'ZAR',
  -- FICA thresholds (editable — changes are recorded in the audit log)
  fica_cash_threshold         BIGINT DEFAULT 1000000,   -- R10,000.00 (in cents)
  dormancy_period_months      INT DEFAULT 12,
  -- CBDA minimums (illustrative — see note on ab_cbda_reports)
  cbda_min_capital_ratio      NUMERIC(5,2) DEFAULT 10.00,
  cbda_min_liquidity_ratio    NUMERIC(5,2) DEFAULT 15.00,
  -- Payment gateway config (generic — no provider selected yet)
  gateway_provider            TEXT,
  gateway_env                 TEXT DEFAULT 'sandbox',
  -- Bookkeeping bridge
  bridge_api_url              TEXT,
  bridge_enabled              BOOLEAN DEFAULT FALSE,
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. ab_audit_log (permanent — POPIA)
-- ============================================================
CREATE TABLE ab_audit_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email    TEXT NOT NULL,
  user_role     TEXT,
  action        TEXT NOT NULL,
  description   TEXT NOT NULL,
  entity_type   TEXT,
  entity_id     UUID,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_members_fica      ON ab_members(fica_status);
CREATE INDEX idx_members_aml       ON ab_members(aml_risk_rating);
CREATE INDEX idx_members_status    ON ab_members(status);
CREATE INDEX idx_members_sa_id     ON ab_members(sa_id_number);
CREATE INDEX idx_members_sars      ON ab_members(sars_tax_number);
CREATE INDEX idx_payment_gateway_ref ON ab_payment_transactions(gateway_reference);
CREATE INDEX idx_payment_member    ON ab_payment_transactions(member_id);
CREATE INDEX idx_payment_fica      ON ab_payment_transactions(fica_flag) WHERE fica_flag = TRUE;
CREATE INDEX idx_tx_date           ON ab_transactions(date);
CREATE INDEX idx_tx_member         ON ab_transactions(member_id);
CREATE INDEX idx_tx_fica           ON ab_transactions(fica_flag) WHERE fica_flag = TRUE;
CREATE INDEX idx_flags_severity    ON ab_compliance_flags(severity);
CREATE INDEX idx_flags_status      ON ab_compliance_flags(status);
CREATE INDEX idx_flags_str         ON ab_compliance_flags(str_required) WHERE str_required = TRUE;
CREATE INDEX idx_audit_created     ON ab_audit_log(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE ab_members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_fica_documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_compliance_flags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_journal_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_journal_lines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_reconciliations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_cbda_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_coop_register        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_settings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_audit_log            ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM ab_users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Members — read all authenticated; write Admin/COO/Compliance
CREATE POLICY "members_select" ON ab_members FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "members_insert" ON ab_members FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'COO', 'Compliance Officer'));
CREATE POLICY "members_update" ON ab_members FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'COO', 'Compliance Officer'));
CREATE POLICY "members_delete" ON ab_members FOR DELETE TO authenticated USING (get_user_role() = 'Admin');

-- FICA Documents
CREATE POLICY "fica_docs_select" ON ab_fica_documents FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "fica_docs_insert" ON ab_fica_documents FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'COO', 'Compliance Officer'));
CREATE POLICY "fica_docs_update" ON ab_fica_documents FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'COO', 'Compliance Officer'));

-- Payment Transactions
CREATE POLICY "payments_select" ON ab_payment_transactions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "payments_insert" ON ab_payment_transactions FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "payments_update" ON ab_payment_transactions FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'COO'));

-- Compliance Flags
CREATE POLICY "flags_select" ON ab_compliance_flags FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "flags_insert" ON ab_compliance_flags FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "flags_update" ON ab_compliance_flags FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'COO', 'Compliance Officer'));

-- Transactions
CREATE POLICY "tx_select" ON ab_transactions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "tx_insert" ON ab_transactions FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'COO'));
CREATE POLICY "tx_update" ON ab_transactions FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'COO'));

-- Journal
CREATE POLICY "journal_select" ON ab_journal_entries FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "journal_insert" ON ab_journal_entries FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'COO'));
CREATE POLICY "journal_lines_select" ON ab_journal_lines FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "journal_lines_insert" ON ab_journal_lines FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'COO'));

-- Reconciliations
CREATE POLICY "recon_select" ON ab_reconciliations FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "recon_insert" ON ab_reconciliations FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'COO'));
CREATE POLICY "recon_update" ON ab_reconciliations FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'COO'));

-- CBDA Reports — Compliance Officers can prepare
CREATE POLICY "cbda_select" ON ab_cbda_reports FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "cbda_insert" ON ab_cbda_reports FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'COO', 'Compliance Officer'));
CREATE POLICY "cbda_update" ON ab_cbda_reports FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'COO', 'Compliance Officer'));

-- Co-op Register
CREATE POLICY "coop_select" ON ab_coop_register FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "coop_insert" ON ab_coop_register FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'COO'));
CREATE POLICY "coop_update" ON ab_coop_register FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'COO'));

-- Users
CREATE POLICY "users_select" ON ab_users FOR SELECT TO authenticated USING (get_user_role() = 'Admin' OR auth_user_id = auth.uid());
CREATE POLICY "users_insert" ON ab_users FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'Admin');
CREATE POLICY "users_update" ON ab_users FOR UPDATE TO authenticated USING (get_user_role() = 'Admin' OR auth_user_id = auth.uid());

-- Settings
CREATE POLICY "settings_select" ON ab_settings FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "settings_update" ON ab_settings FOR UPDATE TO authenticated USING (get_user_role() = 'Admin');

-- Audit Log — permanent, no delete
CREATE POLICY "audit_select" ON ab_audit_log FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "audit_insert" ON ab_audit_log FOR INSERT TO authenticated WITH CHECK (TRUE);
-- NO DELETE POLICY — POPIA audit trail requirement

-- ============================================================
-- DEFAULT SEED: South African Chart of Accounts (IFRS for SMEs)
-- Primary 18 accounts aligned to Roots Books' trial balance
-- ============================================================
INSERT INTO ab_accounts (code, name, category, sub_category, normal_balance, standard_ref) VALUES
-- Assets
('1010', 'Cash on hand',                       'Asset',     'Current Assets',       'Debit',  'IAS 7'),
('1020', 'Bank current account',               'Asset',     'Current Assets',       'Debit',  'IAS 7'),
('1030', 'Investment securities',              'Asset',     'Non-Current Assets',   'Debit',  'IFRS 9'),
('1200', 'Loans to members',                   'Asset',     'Non-Current Assets',   'Debit',  'IFRS 9'),
('1210', 'Provision for doubtful loans',       'Asset',     'Non-Current Assets',   'Credit', 'IFRS 9'),
('1500', 'Equipment (carrying value)',         'Asset',     'Non-Current Assets',   'Debit',  'IAS 16'),
('1600', 'Prepayments',                        'Asset',     'Current Assets',       'Debit',  'IAS 1'),
-- Liabilities
('2010', 'Member savings deposits',            'Liability', 'Current Liabilities',  'Credit', 'IAS 32'),
('2020', 'Member fixed deposits',              'Liability', 'Non-Current Liabs',    'Credit', 'IAS 32'),
('2110', 'Interest payable to members',        'Liability', 'Current Liabilities',  'Credit', 'IAS 37'),
('2200', 'Accruals',                           'Liability', 'Current Liabilities',  'Credit', 'IAS 37'),
('2300', 'SARS — tax payable',                 'Liability', 'Current Liabilities',  'Credit', 'IAS 12'),
('2400', 'External borrowings',                'Liability', 'Non-Current Liabs',    'Credit', 'IAS 32'),
-- Equity
('3000', 'Member share capital',               'Equity',    'Member Equity',        'Credit', 'IAS 32'),
('3100', 'Retained surplus',                   'Equity',    'Retained Earnings',    'Credit', 'IAS 1'),
('3200', 'Statutory reserve (CBDA)',           'Equity',    'Reserves',             'Credit', 'CBDA'),
-- Income
('4100', 'Interest income on member loans',    'Income',    'Operating Income',     'Credit', 'IFRS 15'),
('4200', 'Fee income',                         'Income',    'Operating Income',     'Credit', 'IFRS 15'),
('4300', 'Interest on bank deposits',           'Income',    'Other Income',         'Credit', 'IFRS 9'),
('4400', 'Investment income',                  'Income',    'Other Income',         'Credit', 'IFRS 9'),
-- Expenses
('5100', 'Interest on member savings',         'Expense',   'Finance Costs',        'Debit',  'IAS 23'),
('5200', 'Staff costs',                        'Expense',   'Operating Expenses',   'Debit',  'IAS 19'),
('5300', 'Bank charges',                       'Expense',   'Operating Expenses',   'Debit',  'IAS 1'),
('5400', 'Office & administration',            'Expense',   'Operating Expenses',   'Debit',  'IAS 1'),
('5500', 'Depreciation',                       'Expense',   'Operating Expenses',   'Debit',  'IAS 16'),
('5600', 'Provision for loan losses',          'Expense',   'Credit Risk',          'Debit',  'IFRS 9'),
('5700', 'Audit fees',                         'Expense',   'Professional Fees',    'Debit',  'IAS 1');

-- DEFAULT SETTINGS
INSERT INTO ab_settings (org_name, currency, financial_year_end) VALUES
('SA Aptiv Bookkeeping CRM', 'ZAR', '28 February');
