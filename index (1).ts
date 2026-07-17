import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { formatZAR } from '../services/paymentGateway'
import { Users, ShieldAlert, Wallet, AlertTriangle, CheckCircle, Clock, FileCheck, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { stats, flags, paymentTxs } = useData()
  const { SUPABASE_CONFIGURED } = useAuth()

  const recentFlags = flags.filter(f => f.status !== 'Resolved').slice(0, 4)
  const recentPayments = paymentTxs.slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aptiv Bookkeeping CRM</h1>
        <p className="text-gray-500 text-sm">South Africa Edition — FICA · SARB · CBDA · FSCA · SARS · POPIA</p>
      </div>

      {/* Demo mode banner */}
      {!SUPABASE_CONFIGURED && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center gap-3">
          <span className="text-amber-600 text-lg">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">Demo Mode — Live data not connected</p>
            <p className="text-xs text-amber-700">Running on mock data. Add Supabase credentials as GitHub Secrets to enable live database, authentication, and payment gateway sync.</p>
          </div>
        </div>
      )}

      {/* Regulatory banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-4 text-xs text-emerald-800">
          <span className="font-semibold text-emerald-900">🇿🇦 Active Regulatory Framework:</span>
          <span>• FICA — R10,000.00 cash threshold</span>
          <span>• SARB prudential oversight</span>
          <span>• CBDA prudential standards</span>
          <span>• FSCA market conduct</span>
          <span>• SARS tax compliance</span>
          <span>• POPIA</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Users className="w-5 h-5" />} value={stats.totalMembers} label="Total Members" sub={`${stats.ficaVerified} FICA Verified`} color="blue" />
        <KpiCard icon={<Clock className="w-5 h-5" />} value={stats.ficaIncomplete + stats.ficaNone} label="FICA Pending" sub="Require action" color="amber" />
        <KpiCard icon={<ShieldAlert className="w-5 h-5" />} value={stats.openFlags} label="Open Flags" sub={`${stats.highSeverityFlags} high severity`} color="red" />
        <KpiCard icon={<Wallet className="w-5 h-5" />} value={formatZAR(stats.totalPaymentVol / 100)} label="Payment Volume" sub="All time" color="green" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<AlertTriangle className="w-5 h-5" />} value={stats.strRequired} label="STRs Due to FIC" sub="Suspicious tx reports" color="red" />
        <KpiCard icon={<TrendingUp className="w-5 h-5" />} value={stats.highRisk} label="High-Risk Members" sub="AML rating: High/Very High" color="amber" />
        <KpiCard icon={<FileCheck className="w-5 h-5" />} value={stats.unsyncedTxs} label="Unsynced to Bookkeeping" sub="Bridge sync required" color="blue" />
        <KpiCard icon={<CheckCircle className="w-5 h-5" />} value={`${Math.round((stats.ficaVerified / Math.max(stats.totalMembers,1)) * 100)}%`} label="FICA Completion Rate" sub="Target: 100%" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Compliance Flags */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" /> Open Compliance Flags
            </h2>
            <a href="/compliance" className="text-xs text-emerald-700 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentFlags.length === 0 && (
              <div className="p-5 text-center text-gray-400 text-sm">No open flags</div>
            )}
            {recentFlags.map(f => (
              <div key={f.id} className="px-5 py-3 flex items-start gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${
                  f.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  f.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>{f.severity}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{f.flag_type}</p>
                  <p className="text-xs text-gray-500">{f.member_name} · {f.regulatory_body}</p>
                  {f.str_required && !f.str_filed && (
                    <p className="text-xs text-red-600 font-medium mt-0.5">⚠ STR required — not yet filed</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" /> Recent Payments
            </h2>
            <a href="/payments" className="text-xs text-emerald-700 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentPayments.map(tx => (
              <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.member_name}</p>
                  <p className="text-xs text-gray-500">{tx.gateway_reference} · {tx.transaction_type}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${tx.fica_flag ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatZAR(tx.amount_zar / 100)}
                  </p>
                  <p className={`text-xs ${tx.bookkeeping_synced ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {tx.bookkeeping_synced ? '✓ Synced' : '⏳ Pending sync'}
                  </p>
                  {tx.fica_flag && <p className="text-xs text-red-500 font-medium">FICA ⚠</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CBDA Quick Ratios */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600" /> CBDA Prudential Ratios — Q2 2026
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <RatioCard label="Capital Adequacy" value="14.2%" min="10%" status="pass" />
          <RatioCard label="Liquidity Ratio" value="18.5%" min="15%" status="pass" />
          <RatioCard label="Loan-to-Asset" value="52.3%" max="70%" status="pass" />
          <RatioCard label="External Borrowing" value="8.1%" max="25%" status="pass" />
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, value, label, sub, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="opacity-70">{icon}</div>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs font-semibold mt-1">{label}</div>
      <div className="text-xs opacity-70">{sub}</div>
    </div>
  )
}

function RatioCard({ label, value, min, max, status }) {
  return (
    <div className={`rounded-lg border p-3 ${status === 'pass' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${status === 'pass' ? 'text-emerald-700' : 'text-red-700'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">
        {min && `Min: ${min}`}{max && `Max: ${max}`} — CBDA
      </p>
      <p className={`text-xs font-semibold mt-1 ${status === 'pass' ? 'text-emerald-600' : 'text-red-600'}`}>
        {status === 'pass' ? '✓ Compliant' : '✗ Breach'}
      </p>
    </div>
  )
}
