import { useState } from 'react'
import { BookOpen, ChevronRight, ChevronDown, Plus } from 'lucide-react'
import { formatZAR } from '../services/paymentGateway'

const STATUS_CLS = {
  Posted:   'bg-emerald-100 text-emerald-800',
  Draft:    'bg-gray-100 text-gray-600',
  Reversed: 'bg-red-50 text-red-600',
}

const journalEntries = [
  {
    ref: 'JNL-2026-0518', date: '10 Jul 2026', desc: 'Member deposits — daily batch', status: 'Posted',
    lines: [
      { acct: '1010 · Cash on hand', dr: 1950000, cr: 0 },
      { acct: '2010 · Member savings deposits', dr: 0, cr: 1950000 },
    ],
    meta: 'Posted by D. Mahlangu · 10 Jul 2026 08:59 · Source: member postings batch',
  },
  {
    ref: 'JNL-2026-0517', date: '09 Jul 2026', desc: 'Loan disbursement — RC-2026-008', status: 'Posted',
    lines: [
      { acct: '1200 · Loans to members', dr: 2200000, cr: 0 },
      { acct: '1020 · Bank current account', dr: 0, cr: 2200000 },
    ],
    meta: 'Posted by D. Mahlangu · 09 Jul 2026 16:35',
  },
  {
    ref: 'JNL-2026-0516', date: '08 Jul 2026', desc: 'Bank charges — June 2026', status: 'Posted',
    lines: [
      { acct: '5300 · Bank charges', dr: 48650, cr: 0 },
      { acct: '1020 · Bank current account', dr: 0, cr: 48650 },
    ],
    meta: 'Posted by Neal Titus · 08 Jul 2026 10:02',
  },
  {
    ref: 'JNL-2026-0515', date: '08 Jul 2026', desc: 'Interest accrual on member savings', status: 'Draft',
    lines: [
      { acct: '5100 · Interest on member savings', dr: 321490, cr: 0 },
      { acct: '2110 · Interest payable to members', dr: 0, cr: 321490 },
    ],
    meta: 'Draft · awaiting COO review before posting',
  },
  {
    ref: 'JNL-2026-0513', date: '05 Jul 2026', desc: 'Loan interest raised — July cycle', status: 'Posted',
    lines: [
      { acct: '1200 · Loans to members', dr: 2428610, cr: 0 },
      { acct: '4100 · Interest income on member loans', dr: 0, cr: 2428610 },
    ],
    meta: 'Posted by Neal Titus · 05 Jul 2026 09:30',
  },
]

export default function Journal() {
  const [open, setOpen] = useState('JNL-2026-0518')

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal</h1>
          <p className="text-gray-500 text-sm">Double-entry journal — ZAR · IFRS for SMEs</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Journal Entry
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {journalEntries.map(j => {
          const total = j.lines.reduce((s, l) => s + l.dr, 0)
          const isOpen = open === j.ref
          return (
            <div key={j.ref} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : j.ref)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors">
                <span className="text-gray-400 shrink-0">{isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
                <span className="text-xs font-semibold text-emerald-800 tabular-nums w-28 shrink-0">{j.ref}</span>
                <span className="text-sm text-gray-500 w-24 shrink-0 whitespace-nowrap">{j.date}</span>
                <span className="text-sm font-medium text-gray-900 flex-1 truncate">{j.desc}</span>
                <span className="text-sm tabular-nums font-medium text-gray-900 shrink-0">{formatZAR(total / 100)}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_CLS[j.status]}`}>{j.status}</span>
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
                  <table className="w-full">
                    <thead><tr>
                      <th className="text-left text-xs uppercase tracking-wider text-gray-400 font-semibold pb-2">Account</th>
                      <th className="text-right text-xs uppercase tracking-wider text-gray-400 font-semibold pb-2 w-36">Debit</th>
                      <th className="text-right text-xs uppercase tracking-wider text-gray-400 font-semibold pb-2 w-36">Credit</th>
                    </tr></thead>
                    <tbody>
                      {j.lines.map((ln, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="py-2 text-sm text-gray-700">{ln.acct}</td>
                          <td className="py-2 text-sm text-right tabular-nums text-gray-900">{ln.dr ? formatZAR(ln.dr / 100) : '—'}</td>
                          <td className="py-2 text-sm text-right tabular-nums text-gray-900">{ln.cr ? formatZAR(ln.cr / 100) : '—'}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-200">
                        <td className="py-2 text-sm font-semibold">Totals</td>
                        <td className="py-2 text-sm text-right tabular-nums font-semibold">{formatZAR(total / 100)}</td>
                        <td className="py-2 text-sm text-right tabular-nums font-semibold">{formatZAR(total / 100)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-2">{j.meta}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {journalEntries.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No journal entries yet</p>
        </div>
      )}
    </div>
  )
}
