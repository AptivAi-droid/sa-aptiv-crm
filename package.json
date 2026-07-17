-- ============================================================
-- APTIV BOOKKEEPING CRM — SCHEMA HARDENING PATCH v2
-- Run this AFTER the initial schema.sql
-- South Africa Edition
-- ============================================================
-- What this adds:
-- 1. auto-updated updated_at triggers on all mutable tables
-- 2. Journal double-entry balance check (debit = credit per entry)
-- 3. FK from ab_journal_lines.account_code -> ab_accounts.code
-- 4. Phone format check on ab_members (27XXXXXXXXX)
-- 5. SA ID number checksum guard (Luhn algorithm — defense-in-depth
--    alongside the client-side src/utils/saId.js validator)
-- 6. FICA amount sanity guard -- reject payment transactions over R1,000,000
-- 7. Unique constraint: one settings row per org
-- 8. Account balance update trigger
-- 9. Reporting views
-- ============================================================

-- -- 1. updated_at trigger function --------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ab_members', 'ab_compliance_flags', 'ab_coop_register', 'ab_settings'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON %I;
       CREATE TRIGGER trg_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- -- 2. Journal double-entry balance constraint ---------------------------------
-- Enforced at the entry level: sum of debits must equal sum of credits
CREATE OR REPLACE FUNCTION check_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_total_debit  BIGINT;
  v_total_credit BIGINT;
BEGIN
  -- Only enforce on POSTED entries (allow Drafts to be unbalanced while building)
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1 FROM ab_journal_entries
      WHERE id = NEW.journal_entry_id AND status = 'Posted'
    ) THEN
      SELECT
        COALESCE(SUM(debit_zar), 0),
        COALESCE(SUM(credit_zar), 0)
      INTO v_total_debit, v_total_credit
      FROM ab_journal_lines
      WHERE journal_entry_id = NEW.journal_entry_id;

      IF v_total_debit <> v_total_credit THEN
        RAISE EXCEPTION
          'Double-entry violation: journal entry % debits (%) != credits (%). Difference: % ZAR cents.',
          NEW.journal_entry_id,
          v_total_debit,
          v_total_credit,
          ABS(v_total_debit - v_total_credit)
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_balance ON ab_journal_lines;
CREATE TRIGGER trg_journal_balance
  AFTER INSERT OR UPDATE ON ab_journal_lines
  FOR EACH ROW EXECUTE FUNCTION check_journal_balance();

-- Also check when an entry is POSTED (status changes Draft -> Posted)
CREATE OR REPLACE FUNCTION check_journal_balance_on_post()
RETURNS TRIGGER AS $$
DECLARE
  v_total_debit  BIGINT;
  v_total_credit BIGINT;
BEGIN
  IF NEW.status = 'Posted' AND (OLD.status IS DISTINCT FROM 'Posted') THEN
    SELECT
      COALESCE(SUM(debit_zar), 0),
      COALESCE(SUM(credit_zar), 0)
    INTO v_total_debit, v_total_credit
    FROM ab_journal_lines
    WHERE journal_entry_id = NEW.id;

    IF v_total_debit <> v_total_credit THEN
      RAISE EXCEPTION
        'Double-entry violation: cannot post journal % -- debits (%) != credits (%).',
        NEW.id, v_total_debit, v_total_credit
        USING ERRCODE = 'check_violation';
    END IF;

    IF v_total_debit = 0 THEN
      RAISE EXCEPTION
        'Journal entry % has no lines -- cannot post an empty journal.',
        NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_post_balance ON ab_journal_entries;
CREATE TRIGGER trg_journal_post_balance
  BEFORE UPDATE ON ab_journal_entries
  FOR EACH ROW EXECUTE FUNCTION check_journal_balance_on_post();

-- -- 3. FK: journal lines -> accounts --------------------------------------------
-- Safe to add after initial schema; wraps in DO block to avoid re-run errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_journal_lines_account'
      AND table_name = 'ab_journal_lines'
  ) THEN
    ALTER TABLE ab_journal_lines
      ADD CONSTRAINT fk_journal_lines_account
      FOREIGN KEY (account_code) REFERENCES ab_accounts(code)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END;
$$;

-- -- 4. Phone format check (27XXXXXXXXX -> 11 digits) ----------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'chk_members_phone_format'
  ) THEN
    ALTER TABLE ab_members
      ADD CONSTRAINT chk_members_phone_format
      CHECK (phone ~ '^27[0-9]{9}$');
  END IF;
END;
$$;

-- -- 5. SA ID number checksum guard (Luhn / Mod10) -------------------------------
-- Defense-in-depth alongside the client-side validator in src/utils/saId.js.
-- Only validates the checksum digit (position 13); it does NOT validate that
-- the YYMMDD portion is a real calendar date -- that century-disambiguated
-- check is impractical in plain SQL and is left to the client-side validator.
CREATE OR REPLACE FUNCTION sa_id_checksum_valid(id_number TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  digits INT[];
  i INT;
  odd_sum INT := 0;
  even_concat TEXT := '';
  doubled TEXT;
  even_digit_sum INT := 0;
  total INT;
  expected_check INT;
  ch TEXT;
BEGIN
  IF id_number IS NULL OR id_number !~ '^[0-9]{13}$' THEN
    RETURN FALSE;
  END IF;

  FOR i IN 1..13 LOOP
    digits[i] := substring(id_number FROM i FOR 1)::INT;
  END LOOP;

  -- Odd positions (1st, 3rd, 5th, 7th, 9th, 11th) summed directly
  odd_sum := digits[1] + digits[3] + digits[5] + digits[7] + digits[9] + digits[11];

  -- Even positions (2nd, 4th, 6th, 8th, 10th, 12th) concatenated, doubled,
  -- then digit-summed (standard Luhn doubling step)
  even_concat := digits[2]::TEXT || digits[4]::TEXT || digits[6]::TEXT ||
                 digits[8]::TEXT || digits[10]::TEXT || digits[12]::TEXT;
  doubled := (even_concat::BIGINT * 2)::TEXT;

  FOR i IN 1..length(doubled) LOOP
    ch := substring(doubled FROM i FOR 1);
    even_digit_sum := even_digit_sum + ch::INT;
  END LOOP;

  total := odd_sum + even_digit_sum;
  expected_check := (10 - (total % 10)) % 10;

  RETURN expected_check = digits[13];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'chk_members_sa_id_checksum'
  ) THEN
    ALTER TABLE ab_members
      ADD CONSTRAINT chk_members_sa_id_checksum
      CHECK (sa_id_number IS NULL OR sa_id_checksum_valid(sa_id_number));
  END IF;
END;
$$;

-- SARS tax reference number -- format-only check (no public checksum spec)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'chk_members_sars_format'
  ) THEN
    ALTER TABLE ab_members
      ADD CONSTRAINT chk_members_sars_format
      CHECK (sars_tax_number IS NULL OR sars_tax_number ~ '^[0-9]{10}$');
  END IF;
END;
$$;

-- -- 6. FICA amount sanity guard --------------------------------------------------
-- Reject payment transactions over R1,000,000 (100,000,000 cents) as likely data errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'chk_payment_amount_sanity'
  ) THEN
    ALTER TABLE ab_payment_transactions
      ADD CONSTRAINT chk_payment_amount_sanity
      CHECK (amount_zar > 0 AND amount_zar <= 100000000); -- max R1,000,000 per tx
  END IF;
END;
$$;

-- -- 7. Enforce single settings row -------------------------------------------------
-- The settings table should have exactly one row; prevent accidental duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_singleton
  ON ab_settings ((true)); -- unique index on a constant = max 1 row

-- -- 8. Account balance update function -----------------------------------------------
-- When a journal line is posted, update the account balance automatically
CREATE OR REPLACE FUNCTION update_account_balance_on_post()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- Only act when the parent journal entry is Posted
  SELECT status INTO v_status
  FROM ab_journal_entries
  WHERE id = NEW.journal_entry_id;

  IF v_status = 'Posted' THEN
    UPDATE ab_accounts
    SET balance = balance + NEW.debit_zar - NEW.credit_zar
    WHERE code = NEW.account_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_account_balance ON ab_journal_lines;
CREATE TRIGGER trg_account_balance
  AFTER INSERT ON ab_journal_lines
  FOR EACH ROW EXECUTE FUNCTION update_account_balance_on_post();

-- -- 9. Useful views ------------------------------------------------------------------

-- Trial balance view
CREATE OR REPLACE VIEW vw_trial_balance AS
SELECT
  code,
  name,
  category,
  sub_category,
  normal_balance,
  CASE normal_balance
    WHEN 'Debit' THEN GREATEST(balance, 0)
    ELSE 0
  END AS debit_balance_zar,
  CASE normal_balance
    WHEN 'Credit' THEN GREATEST(balance, 0)
    ELSE 0
  END AS credit_balance_zar,
  standard_ref
FROM ab_accounts
WHERE is_active = TRUE
ORDER BY code;

-- Open STR obligations (FICA reporting)
-- NOTE: 3 working days is used here as an illustrative STR filing window;
-- confirm the actual FIC Act s29 reporting deadline before relying on this
-- in production.
CREATE OR REPLACE VIEW vw_open_str_obligations AS
SELECT
  cf.id,
  cf.member_id,
  cf.member_name,
  cf.flag_type,
  cf.description,
  cf.detected_date,
  cf.regulatory_ref,
  cf.detected_date + INTERVAL '3 days' AS str_deadline,
  CASE
    WHEN NOW() > (cf.detected_date + INTERVAL '3 days')::TIMESTAMPTZ THEN 'OVERDUE'
    WHEN NOW() > (cf.detected_date + INTERVAL '2 days')::TIMESTAMPTZ THEN 'DUE SOON'
    ELSE 'ON TIME'
  END AS deadline_status
FROM ab_compliance_flags cf
WHERE cf.str_required = TRUE
  AND cf.str_filed = FALSE
  AND cf.status NOT IN ('Resolved', 'False Positive')
ORDER BY cf.detected_date ASC;

-- CBDA member summary
CREATE OR REPLACE VIEW vw_cbda_member_summary AS
SELECT
  COUNT(*) AS total_members,
  SUM(share_capital_zar) / 100.0 AS total_share_capital_zar,
  SUM(loan_exposure_zar) / 100.0 AS total_loan_exposure_zar,
  COUNT(*) FILTER (WHERE member_class = 'Youth') AS youth_members,
  COUNT(*) FILTER (WHERE agm_eligible = TRUE) AS agm_eligible_count,
  COUNT(*) FILTER (WHERE exit_date IS NOT NULL) AS exited_members
FROM ab_coop_register;

-- ============================================================
-- DONE -- Schema v2 hardening applied
-- ============================================================
