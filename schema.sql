import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { Building2, Shield, Wallet, RefreshCw, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { settings, setSettings, addAuditEntry } = useData()
  const { isAdmin, user } = useAuth()
  const [form, setForm] = useState({ ...settings })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const sections = [
    {
      title: 'Organisation Profile', icon: <Building2 className="w-4 h-4" />,
      fields: [
        { key: 'org_name', label: 'Organisation Name' },
        { key: 'registration_number', label: 'Registration Number' },
        { key: 'province', label: 'Province of Registration' },
        { key: 'address', label: 'Physical Address' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Admin Email', type: 'email' },
        { key: 'vat_number', label: 'VAT Registration Number' },
        { key: 'financial_year_end', label: 'Financial Year End', placeholder: '28 February / 31 March / 30 June' },
      ]
    },
    {
      title: 'Regulatory Registrations', icon: <Shield className="w-4 h-4" />,
      fields: [
        { key: 'sarb_cfi_licence', label: 'SARB CFI Licence Number', placeholder: 'CFI 00241' },
        { key: 'cbda_registration', label: 'CBDA Registration Number', placeholder: 'CBDA/CFI/YYYY/XXXX' },
      ]
    },
    {
      title: 'Payment Gateway Configuration', icon: <Wallet className="w-4 h-4" />,
      fields: [
        { key: 'gateway_provider', label: 'Payment Gateway Provider' },
        { key: 'gateway_env', label: 'Environment (sandbox / production)' },
      ]
    },
    {
      title: 'Bookkeeping Bridge', icon: <RefreshCw className="w-4 h-4" />,
      fields: [
        { key: 'bridge_api_url', label: 'Bookkeeping API URL', placeholder: 'https://your-api.com' },
      ]
    },
  ]

  const handleSave = () => {
    if (form.fica_cash_threshold !== settings.fica_cash_threshold) {
      addAuditEntry(user?.email, 'SETTINGS_UPDATE', `FICA cash threshold changed to ${form.fica_cash_threshold}`)
    }
    setSettings(form)
    toast.success('Settings saved')
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">South Africa regulatory configuration — FICA · SARB · CBDA</p>
      </div>

      {!isAdmin() && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Settings can only be modified by Admin users. Viewing in read-only mode.
        </div>
      )}

      {sections.map(section => (
        <div key={section.title} className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">{section.icon}</div>
            <h2 className="font-semibold text-gray-800">{section.title}</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                <input type={field.type || 'text'} value={form[field.key] || ''} onChange={e => set(field.key, e.target.value)}
                  placeholder={field.placeholder} disabled={!isAdmin()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Bridge toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Enable Bookkeeping Bridge</p>
            <p className="text-xs text-gray-500">Enables live sync between CRM and Roots Books</p>
          </div>
          <input type="checkbox" checked={form.bridge_enabled} onChange={e => set('bridge_enabled', e.target.checked)}
            disabled={!isAdmin()}
            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-600" />
        </div>
      </div>

      {/* FICA threshold — editable, unlike Kenya's read-only POCAMLA block */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-red-100 rounded-lg text-red-700"><Shield className="w-4 h-4" /></div>
          <h2 className="font-semibold text-gray-800">FICA AML Monitoring</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cash Transaction Reporting Threshold (cents)</label>
            <input type="number" value={form.fica_cash_threshold || ''} onChange={e => set('fica_cash_threshold', parseInt(e.target.value, 10))}
              disabled={!isAdmin()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-50 disabled:text-gray-500" />
            <p className="text-xs text-gray-400 mt-1">1,000,000 cents = R10,000.00. Transactions at or above this amount are auto-flagged for review (FIC Act s28). Changing this value is recorded in the audit log.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Dormancy Period (months)</label>
            <input type="number" value={form.dormancy_period_months || ''} onChange={e => set('dormancy_period_months', parseInt(e.target.value, 10))}
              disabled={!isAdmin()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-50 disabled:text-gray-500" />
            <p className="text-xs text-gray-400 mt-1">Members with no activity for this period are flagged for dormancy review (SARB Directive 1/2022).</p>
          </div>
        </div>
      </div>

      {isAdmin() && (
        <div className="flex justify-end">
          <button onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      )}
    </div>
  )
}
