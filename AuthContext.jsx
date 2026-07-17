/**
 * Aptiv Bookkeeping CRM — Payment Gateway Client
 * Generic EFT / card / instant-payment integration.
 * Routes through Supabase Edge Function (payment-gateway-proxy) — never calls
 * a provider directly from the browser.
 * SECURITY: GATEWAY_API_KEY, GATEWAY_API_SECRET live in Supabase Vault only.
 *
 * No specific payment gateway provider is wired in yet — this module defines
 * the generic shape (initiate / query / callback) so a real provider
 * (EFT, card, instant-payment) can be plugged in without touching the UI.
 */
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase'

async function callGatewayProxy(action, params = {}) {
  if (!SUPABASE_CONFIGURED) {
    console.warn('[Payment Gateway] Demo mode — proxy not available')
    return { demo: true, message: 'Payment gateway calls disabled in demo mode' }
  }
  const { data, error } = await supabase.functions.invoke('payment-gateway-proxy', {
    body: { action, ...params },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function initiatePayment({ phone, amount, accountRef, description }) {
  if (!/^27[0-9]{9}$/.test(phone)) throw new Error('Phone must be in 27XXXXXXXXX format')
  if (!amount || amount < 1) throw new Error('Amount must be at least R1')
  return callGatewayProxy('initiate_payment', { phone, amount, accountRef, description })
}

export async function queryTransactionStatus(transactionId) {
  if (!transactionId) throw new Error('transactionId is required')
  return callGatewayProxy('query_status', { transactionId })
}

export async function registerWebhook() {
  return callGatewayProxy('register_webhook')
}

export function parseGatewayCallback(callbackBody) {
  // Generic envelope parser — field names/shape will need adapting once a
  // real gateway provider is selected; this is a placeholder contract.
  const body = callbackBody?.body
  if (!body) throw new Error('Invalid payment gateway callback structure')
  return {
    gateway_request_id: body.requestId,
    gateway_reference: body.reference,
    result_code: String(body.resultCode),
    result_desc: body.resultDesc,
    amount_zar: body.amount,
    payer_reference: body.payerReference,
    transaction_date: body.transactionDate,
    success: body.resultCode === 0,
  }
}

export function formatZAR(amount) {
  if (amount === null || amount === undefined) return 'R0.00'
  const num = typeof amount === 'number' ? amount : Number(amount)
  return `R${num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function isValidSAPhone(phone) {
  return /^27[0-9]{9}$/.test(String(phone).replace(/\s/g, ''))
}

export function normalisePhone(phone) {
  const p = String(phone).replace(/\s|\+|-/g, '')
  if (p.startsWith('27')) return p
  if (p.startsWith('0') && p.length === 10) return `27${p.slice(1)}`
  if (p.length === 9) return `27${p}`
  return p
}

export function isFicaThreshold(amountZarCents) {
  return amountZarCents >= 1_000_000
}
