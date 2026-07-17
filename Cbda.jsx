import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { formatZAR } from '../services/paymentGateway'
import { Wallet, RefreshCw, AlertTriangle, CheckCircle, Clock, X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  Completed: { cls: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> },
  Pending:   { cls: 'bg-amber-100 text-amber-800',      icon: <Clock className="w-3 h-3" /> },
  Failed:    { cls: 'bg-red-100 text-red-800',          icon: <X className="w-3 h-3" /> },
  Reversed:  { cls: 'bg-gray-100 text-gray-700',        icon: <RefreshCw className="w-3 h-3" /> },
}

export default function Payments() {
  const { paymentTxs, members, addPaymentTx, addAuditEntry } = useData()
  const { user, canWrite } = useAuth()
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterFica, setFilterFica] = useState('All')
  const [showInitiateModal, setShowInitiateModal] = useState(false)

  const filtered = paymentTxs.filter(tx => {
    const matchStatus = filterStatus === 'All' || tx.status === filterStatus
    const matchFica = filterFica === 'All' || (filterFica === 'FICA Flagged' ? tx.fica_flag : !tx.fica_flag)
    return matchStatus && matchFica
  })

  const totalVol = paymentTxs.filter(t => t.status === 'Completed').reduce((s, t) => s + t.amount_zar, 0)
  const ficaCount = paymentTxs.filter(t => t.fica_flag).length
  const unsyncedCount = paymentTxs.filter(t => !t.bookkeeping_synced).length

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 text-sm">Payment Gateway · FICA AML Monitoring · ZAR</p>
        </div>
        {canWrite() && (
          <button onClick={() => setShowInitiateModal(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Initiate Payment
          </button>
        )}
      </div>

      {/* Payment Gateway Bridge status */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Wallet className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Payment Gateway Bridge</p>
            <p className="text-xs text-emerald-700 mt-0.5">No specific provider is wired in yet — this is a generic EFT/card/instant-payment proxy.</p>
            <div className="flex flex-wrap gap-4 mt-1 text-xs text-emerald-700">
              <span>• Payment Request (push-to-pay)</span>
              <span>• Card Payment / Instant EFT</span>
              <span>• Member Payouts</span>
              <span>• Transaction Status Query</span>
              <span>• FICA auto-flag ≥ R10,000.00</span>
              <span>• Auto-sync to Bookkeeping</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Volume (ZAR)" value={formatZAR(totalVol / 100)} color="green" />
        <StatCard label="Total Transactions" value={paymentTxs.length} color="blue" />
        <StatCard label="FICA Flagged" value={ficaCount} color="red" sub="FICA review" />
        <StatCard label="Unsynced to Books" value={unsyncedCount} color="amber" sub="Bridge sync pending" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
          <option value="All">All Status</option>
          {['Completed', 'Pending', 'Failed', 'Reversed', 'Queried'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterFica} onChange={e => setFilterFica(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
          <option value="All">All FICA Status</option>
          <option value="FICA Flagged">FICA Flagged Only</option>
          <option value="Clear">Clear</option>
        </select>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Gateway Reference', 'Member', 'Type', 'Amount (ZAR)', 'Date', 'Status', 'FICA', 'Bookkeeping'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(tx => {
              const stat = STATUS_CONFIG[tx.status] || STATUS_CONFIG.Pending
              return (
                <tr key={tx.id} className={`hover:bg-gray-50 ${tx.fica_flag ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{tx.gateway_reference}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{tx.member_name}</p>
                    <p className="text-xs text-gray-400">{tx.payer_reference}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{tx.transaction_type}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">{formatZAR(tx.amount_zar / 100)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('en-ZA') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${stat.cls}`}>
                      {stat.icon}{tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {tx.fica_flag
                      ? <span className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />FICA ⚠</span>
                      : <span className="text-xs text-emerald-600">✓ Clear</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {tx.bookkeeping_synced
                      ? <span className="text-xs text-emerald-600 font-medium">✓ Synced</span>
                      : (
                        <button
                          onClick={() => {
                            toast.success('Syncing to bookkeeping…')
                            addAuditEntry(user?.email, 'PAYMENT_SYNC', `Manual sync initiated: ${tx.gateway_reference}`)
                          }}
                          className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded font-medium">
                          Sync Now
                        </button>
                      )
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No payment transactions found</p>
          </div>
        )}
      </div>

      {/* Initiate Payment Modal */}
      {showInitiateModal && (
        <InitiatePaymentModal
          members={members}
          onClose={() => setShowInitiateModal(false)}
          onSubmit={(data) => {
            addPaymentTx({
              ...data,
              status: 'Pending',
              transaction_type: 'Payment Request',
              transaction_date: new Date().toISOString(),
              gateway_reference: `PGW-${Date.now()}`,
              bookkeeping_synced: false,
            })
            addAuditEntry(user?.email, 'PAYMENT_INITIATE', `Payment request initiated to ${data.payer_reference} for ${formatZAR(data.amount_zar / 100)}`)
            toast.success('Payment request sent — awaiting confirmation')
            setShowInitiateModal(false)
          }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, color, sub }) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs font-semibold mt-1">{label}</div>
      {sub && <div className="text-xs opacity-70">{sub}</div>}
    </div>
  )
}

function InitiatePaymentModal({ members, onClose, onSubmit }) {
  const [memberId, setMemberId] = useState('')
  const [amount, setAmount] = useState('')
  const [narrative, setNarrative] = useState('')

  const selectedMember = members.find(m => m.id === memberId)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!memberId || !amount) { toast.error('Select a member and enter an amount'); return }
    const amountCents = Math.round(parseFloat(amount) * 100)
    onSubmit({
      member_id: memberId,
      member_name: selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : '',
      payer_reference: selectedMember?.phone || '',
      amount_zar: amountCents,
      narrative,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Initiate Payment</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Member</label>
            <select value={memberId} onChange={e => setMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
              <option value="">— Select member —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.phone})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount (ZAR)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            {parseFloat(amount) >= 10000 && (
              <p className="text-xs text-red-600 mt-1 font-medium">⚠ Meets or exceeds the R10,000.00 FICA threshold — a flag will be auto-generated</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Narrative / Reference</label>
            <input type="text" value={narrative} onChange={e => setNarrative(e.target.value)} placeholder="e.g. Monthly savings deposit"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
          </div>
          <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            <Wallet className="w-4 h-4" /> Send Payment Request
          </button>
        </form>
      </div>
    </div>
  )
}
