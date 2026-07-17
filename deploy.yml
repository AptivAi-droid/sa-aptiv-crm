import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { formatZAR } from '../services/paymentGateway'
import { validateSaId, deriveFromSaId } from '../utils/saId'
import { Users, Plus, Search, CheckCircle, Clock, AlertTriangle, X, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

const FICA_CONFIG = {
  Verified:   { cls: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> },
  Incomplete: { cls: 'bg-amber-100 text-amber-800',      icon: <Clock className="w-3 h-3" /> },
  None:       { cls: 'bg-red-100 text-red-800',          icon: <AlertTriangle className="w-3 h-3" /> },
}

const AML_CONFIG = {
  Low:       'bg-emerald-100 text-emerald-800',
  Medium:    'bg-amber-100 text-amber-800',
  High:      'bg-red-100 text-red-800',
  'Very High': 'bg-red-200 text-red-900',
}

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
]

export default function Members() {
  const { members, addMember, updateMember, addAuditEntry } = useData()
  const { user, canWrite } = useAuth()
  const [search, setSearch] = useState('')
  const [filterFica, setFilterFica] = useState('All')
  const [filterAml, setFilterAml] = useState('All')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showFicaPanel, setShowFicaPanel] = useState(false)

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      m.first_name?.toLowerCase().includes(q) ||
      m.last_name?.toLowerCase().includes(q) ||
      m.member_number?.toLowerCase().includes(q) ||
      m.sa_id_number?.includes(q) ||
      m.sars_tax_number?.includes(q) ||
      m.phone?.includes(q)
    const matchFica = filterFica === 'All' || m.fica_status === filterFica
    const matchAml = filterAml === 'All' || m.aml_risk_rating === filterAml
    return matchSearch && matchFica && matchAml
  })

  const handleVerifyFica = (memberId) => {
    updateMember(memberId, { fica_status: 'Verified', fica_verified_date: new Date().toISOString().split('T')[0], fica_verified_by: user?.id })
    addAuditEntry(user?.email, 'FICA', `FICA verified for member ${memberId}`, 'member', memberId)
    toast.success('FICA verified successfully')
    setShowFicaPanel(false)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members / FICA</h1>
          <p className="text-gray-500 text-sm">FIC Act · POPIA</p>
        </div>
        {canWrite() && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        )}
      </div>

      {/* FICA Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-900 mb-1">FICA Requirements</p>
        <div className="flex flex-wrap gap-3 text-xs text-blue-700">
          <span>• SA ID number / Passport required</span>
          <span>• SARS tax reference for tax compliance</span>
          <span>• Proof of address (utility bill/bank statement)</span>
          <span>• Source of funds documentation</span>
          <span>• PEP screening — enhanced due diligence if PEP</span>
          <span>• Annual FICA refresh</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, SARS ref, phone…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
        </div>
        <select value={filterFica} onChange={e => setFilterFica(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
          <option value="All">All FICA Status</option>
          {['Verified', 'Incomplete', 'None'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterAml} onChange={e => setFilterAml(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
          <option value="All">All AML Risk</option>
          {['Low', 'Medium', 'High', 'Very High'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Member Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Member No', 'Member', 'SA ID / SARS Tax No', 'Phone', 'FICA Status', 'AML Risk', 'Balance', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(m => {
              const fica = FICA_CONFIG[m.fica_status] || FICA_CONFIG.None
              return (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 tabular-nums">{m.member_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{m.first_name} {m.last_name}</div>
                    <div className="text-xs text-gray-400">{m.member_type} · {m.province}</div>
                    {m.aml_pep_status && <div className="text-xs text-red-600 font-semibold">⚠ PEP</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 tabular-nums">
                    <div>{m.sa_id_number || m.passport_number || <span className="text-red-400">Missing</span>}</div>
                    <div className="text-gray-400">{m.sars_tax_number || <span className="text-amber-500">No SARS ref</span>}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">{m.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full w-fit ${fica.cls}`}>
                      {fica.icon}{m.fica_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${AML_CONFIG[m.aml_risk_rating]}`}>
                      {m.aml_risk_rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums">
                    <div className="text-gray-600">{formatZAR(m.savings_balance / 100)}</div>
                    <div className="text-gray-400">Loan: {formatZAR(m.loan_balance / 100)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelected(m); setShowFicaPanel(true) }}
                        className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-1 rounded font-medium">
                        View FICA
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No members found</p>
          </div>
        )}
      </div>

      {/* FICA Detail Panel */}
      {showFicaPanel && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.first_name} {selected.last_name}</h2>
                <p className="text-sm text-gray-500">{selected.member_number} · {selected.member_type}</p>
              </div>
              <button onClick={() => setShowFicaPanel(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* FICA Checklist */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" /> FICA Checklist
                </h3>
                <div className="space-y-2">
                  <FicaItem label="Government-issued ID (SA ID / Passport)" done={!!selected.sa_id_number || !!selected.passport_number} value={selected.sa_id_number || selected.passport_number} />
                  <FicaItem label="SARS tax reference" done={!!selected.sars_tax_number} value={selected.sars_tax_number} />
                  <FicaItem label="Proof of Address verified" done={selected.fica_doc_address_verified} />
                  <FicaItem label="Source of Funds documented (FICA s21)" done={selected.source_of_funds_docs} value={selected.source_of_funds} />
                  <FicaItem label="PEP Screening completed" done={selected.aml_sanctions_checked} extra={selected.aml_pep_status ? '⚠ PEP Identified — EDD Required' : 'No PEP status'} warn={selected.aml_pep_status} />
                  <FicaItem label="UN/OFAC/AU Sanctions check" done={selected.aml_sanctions_checked} />
                </div>
              </div>

              {/* ID Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Detail label="SA ID Number" value={selected.sa_id_number} />
                <Detail label="SARS Tax Reference" value={selected.sars_tax_number} />
                <Detail label="Passport" value={selected.passport_number} />
                <Detail label="Date of Birth" value={selected.date_of_birth} />
                <Detail label="Gender" value={selected.gender} />
                <Detail label="Province" value={selected.province} />
                <Detail label="Phone" value={selected.phone} />
                <Detail label="AML Risk Rating" value={selected.aml_risk_rating} />
                <Detail label="CBDA Member Class" value={selected.cbda_member_class} />
                <Detail label="CBDA Admission Date" value={selected.cbda_admission_date} />
                <Detail label="Co-op Reg Number" value={selected.cbda_reg_number} />
              </div>

              {/* Member Balances */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Member Balances (ZAR)</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-xs text-gray-500">Share Capital</p><p className="font-bold text-emerald-700 tabular-nums">{formatZAR(selected.share_capital / 100)}</p></div>
                  <div><p className="text-xs text-gray-500">Savings</p><p className="font-bold text-blue-700 tabular-nums">{formatZAR(selected.savings_balance / 100)}</p></div>
                  <div><p className="text-xs text-gray-500">Loan Balance</p><p className="font-bold text-red-700 tabular-nums">{formatZAR(selected.loan_balance / 100)}</p></div>
                </div>
              </div>

              {/* Actions */}
              {canWrite() && selected.fica_status !== 'Verified' && (
                <button onClick={() => handleVerifyFica(selected.id)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Mark FICA as Verified
                </button>
              )}
              {selected.fica_status === 'Verified' && (
                <div className="flex items-center justify-center gap-2 text-emerald-700 text-sm font-semibold py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-4 h-4" /> FICA Fully Verified
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAdd && (
        <AddMemberModal
          provinces={PROVINCES}
          onClose={() => setShowAdd(false)}
          onAdd={(data) => {
            addMember(data)
            addAuditEntry(user?.email, 'MEMBER_ADD', `New member onboarded: ${data.first_name} ${data.last_name}`)
            toast.success('Member added successfully')
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

function FicaItem({ label, done, value, extra, warn }) {
  return (
    <div className={`flex items-start gap-3 p-2.5 rounded-lg ${done ? 'bg-emerald-50' : 'bg-red-50'}`}>
      <span className={`flex-shrink-0 mt-0.5 ${done ? 'text-emerald-600' : 'text-red-500'}`}>
        {done ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      </span>
      <div>
        <p className={`text-xs font-medium ${done ? 'text-emerald-800' : 'text-red-800'}`}>{label}</p>
        {value && <p className="text-xs text-gray-500 mt-0.5">{value}</p>}
        {extra && <p className={`text-xs mt-0.5 font-semibold ${warn ? 'text-red-600' : 'text-gray-500'}`}>{extra}</p>}
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-medium text-gray-900 ${!value ? 'text-red-400 italic' : ''}`}>{value || 'Not provided'}</p>
    </div>
  )
}

function AddMemberModal({ onClose, onAdd, provinces }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', sa_id_number: '', sars_tax_number: '',
    phone: '', email: '', province: 'Gauteng', physical_address: '',
    member_type: 'Individual', cbda_member_class: 'Individual',
    source_of_funds: '', aml_pep_status: false,
    fica_status: 'None', aml_risk_rating: 'Low',
  })
  const [idCheck, setIdCheck] = useState({ valid: null, errors: [], derived: null })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleIdChange = (v) => {
    set('sa_id_number', v)
    if (!v) { setIdCheck({ valid: null, errors: [], derived: null }); return }
    const result = validateSaId(v)
    setIdCheck({ ...result, derived: result.valid ? deriveFromSaId(v) : null })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.first_name || !form.last_name || !form.phone) {
      toast.error('First name, last name, and phone are required')
      return
    }
    if (!form.sa_id_number && !form.sars_tax_number) {
      toast.error('At minimum, provide an SA ID number or SARS tax reference (FICA requirement)')
      return
    }
    if (form.sa_id_number && !idCheck.valid) {
      toast.error('SA ID number is invalid — check the format and checksum')
      return
    }
    onAdd({
      ...form,
      date_of_birth: idCheck.derived?.dateOfBirth || null,
      gender: idCheck.derived?.gender || null,
      share_capital: 100000,
      savings_balance: 0,
      loan_balance: 0,
      fica_doc_id_verified: !!form.sa_id_number,
      fica_doc_address_verified: false,
      fica_doc_income_verified: false,
      source_of_funds_docs: false,
      bridge_synced: false,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold">Onboard New Member</h2>
          <p className="text-xs text-gray-500">FICA</p>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Section title="Personal Information">
            <FormRow>
              <Field label="First Name *" value={form.first_name} onChange={v => set('first_name', v)} />
              <Field label="Last Name / Entity Name *" value={form.last_name} onChange={v => set('last_name', v)} />
            </FormRow>
            <FormRow>
              <div>
                <Field label="SA ID Number" value={form.sa_id_number} onChange={handleIdChange} placeholder="13-digit SA ID number" />
                {idCheck.errors.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">{idCheck.errors.join(', ')}</p>
                )}
                {idCheck.valid && idCheck.derived && (
                  <p className="text-xs text-emerald-700 mt-1 tabular-nums">
                    ✓ DOB {idCheck.derived.dateOfBirth} · {idCheck.derived.gender} · {idCheck.derived.citizenship}
                  </p>
                )}
              </div>
              <Field label="SARS Tax Reference" value={form.sars_tax_number} onChange={v => set('sars_tax_number', v)} placeholder="10-digit tax reference" />
            </FormRow>
            <FormRow>
              <Field label="Phone *" value={form.phone} onChange={v => set('phone', v)} placeholder="0XX XXX XXXX" />
              <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
            </FormRow>
            <FormRow>
              <SelectField label="Province" value={form.province} onChange={v => set('province', v)} options={provinces} />
              <Field label="Physical Address" value={form.physical_address} onChange={v => set('physical_address', v)} />
            </FormRow>
          </Section>

          <Section title="FICA / AML">
            <FormRow>
              <SelectField label="Member Type" value={form.member_type} onChange={v => set('member_type', v)}
                options={['Individual', 'Corporate', 'Co-operative', 'Partnership', 'NGO']} />
              <SelectField label="CBDA Member Class" value={form.cbda_member_class} onChange={v => set('cbda_member_class', v)}
                options={['Individual', 'Corporate', 'Institutional', 'Youth']} />
            </FormRow>
            <FormRow>
              <Field label="Source of Funds (FICA s21)" value={form.source_of_funds} onChange={v => set('source_of_funds', v)} placeholder="Employment, Business, Agriculture…" />
              <SelectField label="Initial AML Risk Rating" value={form.aml_risk_rating} onChange={v => set('aml_risk_rating', v)}
                options={['Low', 'Medium', 'High', 'Very High']} />
            </FormRow>
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <input type="checkbox" id="pep" checked={form.aml_pep_status} onChange={e => set('aml_pep_status', e.target.checked)}
                className="w-4 h-4 text-emerald-600" />
              <label htmlFor="pep" className="text-sm font-medium text-amber-800">
                ⚠ Politically Exposed Person (PEP) — Enhanced Due Diligence required (FICA s21)
              </label>
            </div>
          </Section>

          <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-semibold text-sm">
            Onboard Member
          </button>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-100">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
function FormRow({ children }) { return <div className="grid grid-cols-2 gap-3">{children}</div> }
function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
    </div>
  )
}
function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}
