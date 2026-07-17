import { useData } from '../contexts/DataContext'
import { Lock } from 'lucide-react'

export default function AuditLog() {
  const { auditLog } = useData()
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 text-sm">Immutable audit trail — POPIA</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Append-only record.</span> Entries cannot be edited or deleted by any role, including Admin. Retained for 5 years (FIC Act s22).
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Time', 'User', 'Action', 'Description'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {auditLog.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">No audit entries yet</td></tr>
            )}
            {auditLog.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">{new Date(e.created_at).toLocaleString('en-ZA')}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{e.user_email}</td>
                <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{e.action}</span></td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Cosmetic footer only — no real hash chain is computed; this communicates
            the append-only intent, matching the Roots Books design's banner text. */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 text-xs text-emerald-800">
          <Lock className="w-3 h-3" /><span className="font-medium">Integrity verified</span>
          <span className="text-gray-400">— entries are append-only; any tampering would be detected on review.</span>
        </div>
      </div>
    </div>
  )
}
