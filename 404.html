import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { formatZAR } from '../services/paymentGateway'
import { Download, Printer } from 'lucide-react'

const tabs = [
  { key: 'is', label: 'Income Statement' },
  { key: 'bs', label: 'Balance Sheet' },
  { key: 'tb', label: 'Trial Balance' },
]

const trialBalance = [
  { code: '1010', name: 'Cash on hand', dr: 8421000, cr: 0 },
  { code: '1020', name: 'Bank current account', dr: 118414072, cr: 0 },
  { code: '1200', name: 'Loans to members', dr: 291430000, cr: 0 },
  { code: '1210', name: 'Provision for doubtful loans', dr: 0, cr: 8742900 },
  { code: '1500', name: 'Equipment (carrying value)', dr: 6430000, cr: 0 },
  { code: '2010', name: 'Member savings deposits', dr: 0, cr: 341278000 },
  { code: '2110', name: 'Interest payable to members', dr: 0, cr: 1844200 },
  { code: '2200', name: 'Accruals', dr: 0, cr: 973000 },
  { code: '3000', name: 'Member share capital', dr: 0, cr: 48000000 },
  { code: '3100', name: 'Retained surplus', dr: 0, cr: 12202372 },
  { code: '4100', name: 'Interest income on member loans', dr: 0, cr: 24831000 },
  { code: '4200', name: 'Fee income', dr: 0, cr: 3842000 },
  { code: '4300', name: 'Interest on bank deposits', dr: 0, cr: 2188400 },
  { code: '5100', name: 'Interest on member savings', dr: 6412000, cr: 0 },
  { code: '5200', name: 'Staff costs', dr: 9600000, cr: 0 },
  { code: '5300', name: 'Bank charges', dr: 291800, cr: 0 },
  { code: '5400', name: 'Office & administration', dr: 2143000, cr: 0 },
  { code: '5500', name: 'Depreciation', dr: 760000, cr: 0 },
]
const tbTotal = trialBalance.reduce((s, a) => s + a.dr, 0)

export default function Reports() {
  const { settings } = useData()
  const [tab, setTab] = useState('is')

  const orgName = settings?.org_name || 'SA Aptiv Bookkeeping CRM'

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-1 flex gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                tab === t.key ? 'bg-emerald-700 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}>{t.label}</button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button className="inline-flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-3.5 py-2 rounded-lg">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button className="inline-flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-3.5 py-2 rounded-lg">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto bg-white border border-gray-200 rounded-sm shadow-sm">
        <div className="text-center pt-10 pb-6 px-10 border-b-2 border-emerald-800">
          <div className="text-xl font-extrabold tracking-widest text-emerald-900 uppercase">{orgName}</div>
          <div className="text-xs text-gray-500 mt-1.5 tracking-wide">SARB CFI {settings?.sarb_cfi_licence || '—'} · CBDA {settings?.cbda_registration || '—'}</div>
          <div className="text-sm font-semibold mt-5 text-gray-900">
            {tab === 'is' && 'Income Statement'}
            {tab === 'bs' && 'Balance Sheet'}
            {tab === 'tb' && 'Trial Balance'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {tab === 'is' && 'For the period ended 10 July 2026 (unaudited)'}
            {tab === 'bs' && 'As at 10 July 2026 (unaudited)'}
            {tab === 'tb' && 'As at 10 July 2026 · all posted journals'}
          </div>
        </div>

        {tab === 'is' && (
          <div className="px-10 py-8">
            <ReportSection title="Income">
              <Line label="Interest income on member loans" value={248310} />
              <Line label="Fee income" value={38420} />
              <Line label="Interest on bank deposits" value={21884} />
              <Total label="Total income" value={308614} />
            </ReportSection>
            <ReportSection title="Expenditure" className="mt-7">
              <Line label="Interest on member savings" value={64120} />
              <Line label="Staff costs" value={96000} />
              <Line label="Office & administration" value={21430} />
              <Line label="Depreciation" value={7600} />
              <Line label="Bank charges" value={2918} />
              <Total label="Total expenditure" value={192068} />
            </ReportSection>
            <div className="flex justify-between py-3 mt-4 text-sm font-bold text-emerald-900 border-t-2 border-b-4 border-double border-emerald-800">
              <span>Surplus for the period</span><span className="tabular-nums">{formatZAR(116546)}</span>
            </div>
          </div>
        )}

        {tab === 'bs' && (
          <div className="px-10 py-8">
            <ReportSection title="Assets">
              <Line label="Cash on hand" value={84210} />
              <Line label="Bank current account" value={1184140.72} />
              <Line label="Loans to members" value={2914300} />
              <Line label="Provision for doubtful loans" value={-87429} />
              <Line label="Equipment (carrying value)" value={64300} />
              <Total label="Total assets" value={4159521.72} />
            </ReportSection>
            <ReportSection title="Liabilities" className="mt-7">
              <Line label="Member savings deposits" value={3412780} />
              <Line label="Interest payable to members" value={18442} />
              <Line label="Accruals" value={9730} />
              <Total label="Total liabilities" value={3440952} />
            </ReportSection>
            <ReportSection title="Equity" className="mt-7">
              <Line label="Member share capital" value={480000} />
              <Line label="Retained surplus" value={122023.72} />
              <Line label="Surplus for the period" value={116546} />
              <Total label="Total equity" value={718569.72} />
            </ReportSection>
            <div className="flex justify-between py-3 mt-4 text-sm font-bold text-emerald-900 border-t-2 border-b-4 border-double border-emerald-800">
              <span>Total liabilities &amp; equity</span><span className="tabular-nums">{formatZAR(4159521.72)}</span>
            </div>
          </div>
        )}

        {tab === 'tb' && (
          <div className="px-10 py-8">
            <table className="w-full">
              <thead><tr className="border-b border-gray-300">
                <th className="text-left text-xs uppercase tracking-wider text-emerald-900 font-bold pb-2">Account</th>
                <th className="text-right text-xs uppercase tracking-wider text-emerald-900 font-bold pb-2 w-36">Debit</th>
                <th className="text-right text-xs uppercase tracking-wider text-emerald-900 font-bold pb-2 w-36">Credit</th>
              </tr></thead>
              <tbody>
                {trialBalance.map(a => (
                  <tr key={a.code} className="border-b border-gray-50">
                    <td className="py-1.5 text-sm text-gray-700"><span className="text-gray-400 tabular-nums mr-2">{a.code}</span>{a.name}</td>
                    <td className="py-1.5 text-sm text-right tabular-nums">{a.dr ? formatZAR(a.dr / 100) : '—'}</td>
                    <td className="py-1.5 text-sm text-right tabular-nums">{a.cr ? formatZAR(a.cr / 100) : '—'}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-b-4 border-double border-emerald-800">
                  <td className="py-2.5 text-sm font-bold text-emerald-900">Totals</td>
                  <td className="py-2.5 text-sm text-right tabular-nums font-bold text-emerald-900">{formatZAR(tbTotal / 100)}</td>
                  <td className="py-2.5 text-sm text-right tabular-nums font-bold text-emerald-900">{formatZAR(tbTotal / 100)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="px-10 pb-6 text-xs text-gray-400 flex justify-between">
          <span>Prepared from posted journals only · unaudited</span>
          <span>Generated 10 Jul 2026 · SA Aptiv Bookkeeping CRM</span>
        </div>
      </div>
    </div>
  )
}

function ReportSection({ title, children, className = '' }) {
  return (
    <div className={className}>
      <div className="text-xs uppercase tracking-wider font-bold text-emerald-900 pb-2 border-b border-gray-200">{title}</div>
      {children}
    </div>
  )
}
function Line({ label, value }) {
  const display = value < 0 ? `(${formatZAR(Math.abs(value))})` : formatZAR(value)
  return (
    <div className="flex justify-between py-2 text-sm border-b border-gray-50">
      <span className="text-gray-700">{label}</span><span className="tabular-nums">{display}</span>
    </div>
  )
}
function Total({ label, value }) {
  return (
    <div className="flex justify-between py-2.5 text-sm font-semibold border-t border-gray-300">
      <span>{label}</span><span className="tabular-nums">{formatZAR(value)}</span>
    </div>
  )
}
