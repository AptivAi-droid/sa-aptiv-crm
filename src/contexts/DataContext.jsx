import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase'
import {
  mockMembers, mockPaymentTransactions, mockComplianceFlags,
  mockCbdaReport, mockSettings, mockUsers,
} from '../data/mockData'
import { isFicaThreshold } from '../services/paymentGateway'
import toast from 'react-hot-toast'

const DataContext = createContext(null)

// ── Member number generation (collision-safe, not array-length dependent) ────
function generateMemberNumber(existingNumbers) {
  const year = new Date().getFullYear()
  let n = existingNumbers.length + 1
  let number
  const existing = new Set(existingNumbers)
  do {
    number = `RC-${year}-${String(n).padStart(3, '0')}`
    n++
  } while (existing.has(number))
  return number
}

export function DataProvider({ children }) {
  const [members,     setMembers]     = useState([])
  const [paymentTxs,  setPaymentTxs]  = useState([])
  const [flags,       setFlags]       = useState([])
  const [cbdaReport,  setCbdaReport]  = useState(null)
  const [settings,    setSettings]    = useState(null)
  const [users,       setUsers]       = useState([])
  const [auditLog,    setAuditLog]    = useState([])
  const [loading,     setLoading]     = useState(true)

  // Track whether we've done the initial load
  const initialised = useRef(false)

  // ── Initialise data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    if (!SUPABASE_CONFIGURED) {
      // Demo mode — use mock data immediately
      setMembers(mockMembers)
      setPaymentTxs(mockPaymentTransactions)
      setFlags(mockComplianceFlags)
      setCbdaReport(mockCbdaReport)
      setSettings(mockSettings)
      setUsers(mockUsers)
      setLoading(false)
      return
    }

    // Live mode — fetch from Supabase
    ;(async () => {
      try {
        const [
          { data: membersData, error: membersErr },
          { data: paymentData, error: paymentErr },
          { data: flagsData,   error: flagsErr   },
          { data: cbdaData,    error: cbdaErr    },
          { data: settingsData,error: settingsErr},
          { data: usersData,   error: usersErr   },
          { data: auditData,   error: auditErr   },
        ] = await Promise.all([
          supabase.from('ab_members').select('*').order('created_at', { ascending: false }),
          supabase.from('ab_payment_transactions').select('*').order('created_at', { ascending: false }).limit(500),
          supabase.from('ab_compliance_flags').select('*').order('created_at', { ascending: false }),
          supabase.from('ab_cbda_reports').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('ab_settings').select('*').maybeSingle(),
          supabase.from('ab_users').select('*'),
          supabase.from('ab_audit_log').select('*').order('created_at', { ascending: false }).limit(200),
        ])

        const errors = [membersErr, paymentErr, flagsErr, cbdaErr, settingsErr, usersErr, auditErr].filter(Boolean)
        if (errors.length) {
          console.error('[DataContext] Supabase load errors:', errors)
          toast.error('Some data failed to load — check console')
        }

        setMembers(membersData || [])
        setPaymentTxs(paymentData || [])
        setFlags(flagsData || [])
        setCbdaReport(cbdaData || mockCbdaReport)
        setSettings(settingsData || mockSettings)
        setUsers(usersData || [])
        setAuditLog(auditData || [])
      } catch (err) {
        console.error('[DataContext] Critical load failure:', err)
        toast.error('Failed to load data from database')
        // Fallback to mock so the app remains usable
        setMembers(mockMembers)
        setPaymentTxs(mockPaymentTransactions)
        setFlags(mockComplianceFlags)
        setCbdaReport(mockCbdaReport)
        setSettings(mockSettings)
        setUsers(mockUsers)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ── Members ──────────────────────────────────────────────────────────────
  const addMember = useCallback(async (memberData) => {
    const member_number = generateMemberNumber(members.map(m => m.member_number))
    const newMember = {
      ...memberData,
      member_number,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (SUPABASE_CONFIGURED) {
      const { data, error } = await supabase.from('ab_members').insert(newMember).select().single()
      if (error) throw new Error(`Failed to add member: ${error.message}`)
      setMembers(prev => [data, ...prev])
      return data
    }
    const withId = { ...newMember, id: crypto.randomUUID() }
    setMembers(prev => [withId, ...prev])
    return withId
  }, [members])

  const updateMember = useCallback(async (id, updates) => {
    const updated = { ...updates, updated_at: new Date().toISOString() }
    if (SUPABASE_CONFIGURED) {
      const { data, error } = await supabase.from('ab_members').update(updated).eq('id', id).select().single()
      if (error) throw new Error(`Failed to update member: ${error.message}`)
      setMembers(prev => prev.map(m => m.id === id ? data : m))
      return data
    }
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m))
  }, [])

  // ── Payment Transactions ─────────────────────────────────────────────────
  const addPaymentTx = useCallback(async (tx) => {
    const ficaFlag = isFicaThreshold(tx.amount_zar) // amount in ZAR cents
    const newTx = {
      ...tx,
      fica_flag: ficaFlag || tx.fica_flag || false,
      created_at: new Date().toISOString(),
    }

    let savedTx = newTx
    if (SUPABASE_CONFIGURED) {
      const { data, error } = await supabase.from('ab_payment_transactions').insert(newTx).select().single()
      if (error) throw new Error(`Failed to record payment tx: ${error.message}`)
      savedTx = data
    } else {
      savedTx = { ...newTx, id: crypto.randomUUID() }
    }

    setPaymentTxs(prev => [savedTx, ...prev])

    // Auto-create FICA flag if threshold exceeded
    if (ficaFlag) {
      await addFlag({
        member_id:       tx.member_id,
        member_name:     tx.member_name,
        payment_tx_id:   savedTx.id,
        severity:        'HIGH',
        flag_type:       'Large Cash Transaction — FICA',
        description:     `Payment transaction of R${(tx.amount_zar / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} meets or exceeds the R10,000.00 FICA cash threshold. STR filing required within 3 days.`,
        regulatory_body: 'FICA',
        regulatory_ref:  'FIC Act s28 — Suspicious Transaction Reporting',
        str_required:    true,
        str_filed:       false,
        status:          'Open',
        detected_date:   new Date().toISOString().split('T')[0],
      })
    }

    return savedTx
  }, []) // addFlag is stable (defined below with no deps)

  // ── Compliance Flags ─────────────────────────────────────────────────────
  const addFlag = useCallback(async (flag) => {
    const newFlag = { ...flag, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    if (SUPABASE_CONFIGURED) {
      const { data, error } = await supabase.from('ab_compliance_flags').insert(newFlag).select().single()
      if (error) throw new Error(`Failed to add flag: ${error.message}`)
      setFlags(prev => [data, ...prev])
      return data
    }
    const withId = { ...newFlag, id: crypto.randomUUID() }
    setFlags(prev => [withId, ...prev])
    return withId
  }, [])

  const updateFlag = useCallback(async (id, updates) => {
    const updated = { ...updates, updated_at: new Date().toISOString() }
    if (SUPABASE_CONFIGURED) {
      const { data, error } = await supabase.from('ab_compliance_flags').update(updated).eq('id', id).select().single()
      if (error) throw new Error(`Failed to update flag: ${error.message}`)
      setFlags(prev => prev.map(f => f.id === id ? data : f))
      return data
    }
    setFlags(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f))
  }, [])

  // ── Audit Log ────────────────────────────────────────────────────────────
  const addAuditEntry = useCallback(async (userEmail, action, description, entityType = null, entityId = null) => {
    const entry = {
      user_email:  userEmail || 'unknown',
      user_role:   null,
      action,
      description,
      entity_type: entityType,
      entity_id:   entityId || null,
      created_at:  new Date().toISOString(),
    }
    if (SUPABASE_CONFIGURED) {
      // Fire-and-forget — audit log failures should not block user actions
      supabase.from('ab_audit_log').insert(entry).then(({ error }) => {
        if (error) console.error('[Audit] Failed to write log:', error.message)
      })
    }
    setAuditLog(prev => [{ ...entry, id: crypto.randomUUID() }, ...prev])
  }, [])

  // ── Settings update ──────────────────────────────────────────────────────
  const saveSettings = useCallback(async (newSettings) => {
    if (SUPABASE_CONFIGURED) {
      const { data, error } = await supabase.from('ab_settings').update(newSettings).eq('id', newSettings.id).select().single()
      if (error) throw new Error(`Failed to save settings: ${error.message}`)
      setSettings(data)
      return data
    }
    setSettings(newSettings)
    return newSettings
  }, [])

  // ── Derived Stats ────────────────────────────────────────────────────────
  const stats = {
    totalMembers:      members.length,
    ficaVerified:      members.filter(m => m.fica_status === 'Verified').length,
    ficaIncomplete:    members.filter(m => m.fica_status === 'Incomplete').length,
    ficaNone:          members.filter(m => m.fica_status === 'None').length,
    highRisk:          members.filter(m => ['High', 'Very High'].includes(m.aml_risk_rating)).length,
    openFlags:         flags.filter(f => !['Resolved', 'False Positive'].includes(f.status)).length,
    highSeverityFlags: flags.filter(f => f.severity === 'HIGH' && f.status !== 'Resolved').length,
    strRequired:       flags.filter(f => f.str_required && !f.str_filed).length,
    totalPaymentVol:   paymentTxs.filter(t => t.status === 'Completed').reduce((s, t) => s + (t.amount_zar || 0), 0),
    unsyncedTxs:       paymentTxs.filter(t => !t.bookkeeping_synced).length,
    // CBDA prudential ratios — from most recent CBDA report if available
    cbdaCapital:    cbdaReport?.capital_adequacy_ratio    || null,
    cbdaLiquidity:  cbdaReport?.liquidity_ratio           || null,
    cbdaLoanAsset:  cbdaReport?.loan_to_asset_ratio       || null,
    cbdaBorrowing:  cbdaReport?.external_borrowing_ratio  || null,
  }

  return (
    <DataContext.Provider value={{
      loading,
      members, paymentTxs, flags, cbdaReport, settings, users, auditLog, stats,
      addMember, updateMember,
      addPaymentTx, addFlag, updateFlag,
      addAuditEntry,
      setSettings: saveSettings,
      setCbdaReport,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}
