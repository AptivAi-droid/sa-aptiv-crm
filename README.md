import { useData } from '../contexts/DataContext'
import { formatZAR } from '../services/paymentGateway'
import { Building2 } from 'lucide-react'

export default function CoopRegister() {
  const { members } = useData()
  const totalShareCapital = members.reduce((s, m) => s + (m.share_capital || 0), 0)
  const totalSavings = members.reduce((s, m) => s + (m.savings_balance || 0), 0)
  const totalLoans = members.reduce((s, m) => s + (m.loan_balance || 0), 0)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Co-operative Register</h1>
        <p className="text-gray-500 text-sm">CBDA — Co-operative Banks Act 40 of 2007</p>
      </div>

      {/* Regulatory Info */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-emerald-900 mb-2">CBDA Register Requirements</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-emerald-800">
          <span>• Member register must be maintained at registered office</span>
          <span>• AGM required annually within 4 months of FY end</span>
          <span>• Audited accounts submitted to CBDA annually</span>
          <span>• Member share transfers require board approval</span>
          <span>• Minimum member count to register a co-operative bank</span>
          <span>• Dividends limited to share capital contribution ratio</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Share Capital</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">{formatZAR(totalShareCapital / 100)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Savings</p>
          <p className="text-2xl font-bold text-blue-700 tabular-nums">{formatZAR(totalSavings / 100)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Loan Exposure</p>
          <p className="text-2xl font-bold text-red-700 tabular-nums">{formatZAR(totalLoans / 100)}</p>
        </div>
      </div>

      {/* Member Register */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <h2 className="font-semibold text-gray-900">Member Register</h2>
          <span className="ml-auto text-xs text-gray-500">Total: {members.length} members</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Member No', 'Member Name', 'Type', 'Member Class', 'Share Capital', 'Savings', 'Loan Exposure', 'FICA'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500 tabular-nums">{m.member_number}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{m.first_name} {m.last_name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{m.member_type}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{m.cbda_member_class || '—'}</td>
                <td className="px-4 py-3 text-xs text-emerald-700 font-medium tabular-nums">{formatZAR(m.share_capital / 100)}</td>
                <td className="px-4 py-3 text-xs text-blue-700 tabular-nums">{formatZAR(m.savings_balance / 100)}</td>
                <td className="px-4 py-3 text-xs text-red-700 tabular-nums">{formatZAR(m.loan_balance / 100)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    m.fica_status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>{m.fica_status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
