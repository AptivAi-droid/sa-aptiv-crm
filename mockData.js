/**
 * Aptiv Bookkeeping CRM — Bookkeeping Bridge Client
 * Bridges into Roots Books (Roots Co-operative Bank bookkeeping system).
 * Calls the Supabase Edge Function (bridge-proxy) — NOT the bridge API directly.
 * SECURITY: BRIDGE_API_KEY is a server-side secret in Supabase Vault.
 */
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase'

async function bridgeCall(path, method = 'GET', body = null) {
  if (!SUPABASE_CONFIGURED) return { connected: false, message: 'Bridge unavailable in demo mode' }
  const { data, error } = await supabase.functions.invoke('bridge-proxy', {
    body: { path, method, body },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function pushMemberToBookkeeping(member) {
  return bridgeCall('/members', 'POST', {
    member_number: member.member_number, first_name: member.first_name, last_name: member.last_name,
    id_number: member.sa_id_number, phone: member.phone, email: member.email,
    address: member.physical_address, kyc_status: member.fica_status, source: 'aptiv-crm-sa',
  })
}

export async function pullMemberFromBookkeeping(memberNumber) {
  return bridgeCall(`/members/${encodeURIComponent(memberNumber)}`)
}

export async function updateKycStatusInBookkeeping(memberNumber, ficaStatus) {
  return bridgeCall(`/members/${encodeURIComponent(memberNumber)}/kyc`, 'PATCH', { kyc_status: ficaStatus })
}

export async function pushPaymentTransactionToBookkeeping(tx) {
  return bridgeCall('/transactions', 'POST', {
    date: tx.transaction_date, member_id: tx.member_id, member_name: tx.member_name,
    type: tx.transaction_type, amount: tx.amount_zar, currency: 'ZAR',
    reference: tx.gateway_reference, description: `Payment gateway: ${tx.gateway_reference}`,
    source: 'payment-gateway', gateway_reference: tx.gateway_reference,
  })
}

export async function fetchMemberTransactions(memberId) {
  return bridgeCall(`/members/${encodeURIComponent(memberId)}/transactions`)
}

export async function pushComplianceFlagToBookkeeping(flag) {
  return bridgeCall('/compliance', 'POST', {
    member_id: flag.member_id, category: flag.severity, type: flag.flag_type,
    description: flag.description, regulatory_reference: flag.regulatory_ref,
    source: 'aptiv-crm-sa',
  })
}

export async function fetchComplianceFlagsFromBookkeeping(memberId) {
  return bridgeCall(`/members/${encodeURIComponent(memberId)}/compliance`)
}

export async function fetchMemberBalances(memberId) {
  return bridgeCall(`/members/${encodeURIComponent(memberId)}/balances`)
}

export async function checkBridgeHealth() {
  try { const res = await bridgeCall('/health'); return { connected: true, ...res } }
  catch { return { connected: false, message: 'Bookkeeping bridge unreachable' } }
}
