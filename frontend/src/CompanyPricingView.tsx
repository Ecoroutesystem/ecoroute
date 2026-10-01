import { useEffect, useState, type FormEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import './App.css'

type CustomerType = 'Household' | 'Company / Institution'
type PricingRule = { id: string; customerType: CustomerType; amount: number; billingPeriod: string; description: string | null; active: boolean; createdAt: string }
const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const money = new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 })

export default function CompanyPricingView({ companyId }: { companyId: string }) {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [customerType, setCustomerType] = useState<CustomerType>('Household')
  const [amount, setAmount] = useState('')
  const [billingPeriod, setBillingPeriod] = useState('Monthly')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    void fetch(`${apiBase}/api/companies/${encodeURIComponent(companyId)}/pricing`)
      .then(async (response) => {
        const result = await response.json() as PricingRule[] | { error?: string }
        if (!response.ok) throw new Error('error' in result ? result.error : 'Pricing rules could not be loaded.')
        if (active) setRules(result as PricingRule[])
      })
      .catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Pricing rules could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [companyId])

  const submitRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`${apiBase}/api/companies/${encodeURIComponent(companyId)}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerType, amount: Number(amount), billingPeriod, description }),
      })
      const result = await response.json() as PricingRule | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Pricing rule could not be saved.')
      setRules((current) => [result as PricingRule, ...current])
      setAmount('')
      setDescription('')
      setNotice(`${customerType} price saved. New customers of this type will use the latest active rule.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Pricing rule could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const toggleRule = async (rule: PricingRule) => {
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/companies/${encodeURIComponent(companyId)}/pricing/${rule.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !rule.active }),
      })
      const result = await response.json() as PricingRule | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Pricing rule could not be updated.')
      setRules((current) => current.map((item) => item.id === rule.id ? result as PricingRule : item))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Pricing rule could not be updated.')
    }
  }

  return <>
    <div className="admin-heading">
      <div><p className="section-kicker"><span className="kicker-line" /> BILLING CONFIGURATION</p><h1>Pricing &amp; Services</h1><p>Set the amount and billing period for each customer type.</p></div>
    </div>
    {error && <p className="settings-error company-error" role="alert">{error}</p>}
    {notice && <p className="payment-notice"><Check size={15} />{notice}</p>}
    <section className="admin-panel company-list">
      <div className="admin-panel-heading"><div><h2>Add pricing rule</h2><p>Prices are company-specific and apply to new customer accounts.</p></div></div>
      <form className="company-form" onSubmit={submitRule}>
        <label>Customer / service type<select value={customerType} onChange={(event) => setCustomerType(event.target.value as CustomerType)}><option>Household</option><option>Company / Institution</option></select></label>
        <label>Amount (RWF)<input type="number" min="1" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter your price" /></label>
        <label>Billing period<select value={billingPeriod} onChange={(event) => setBillingPeriod(event.target.value)}><option>Weekly</option><option>Monthly</option><option>Quarterly</option><option>Yearly</option></select></label>
        <label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional service description" /></label>
        <div className="company-form-actions"><button type="submit" className="admin-save" disabled={saving || !companyId}><Plus size={14} /> {saving ? 'Saving...' : 'Save price'}</button></div>
      </form>
    </section>
    <section className="admin-panel company-list">
      <div className="admin-panel-heading"><div><h2>Service prices</h2><p>The most recently saved active price is used for new customers of that type.</p></div></div>
      {loading ? <p className="company-loading">Loading pricing rules...</p> : rules.length === 0 ? <p className="company-loading">No prices configured yet. Add a Household and/or Company price to get started.</p> : rules.map((rule) => <div className="company-status-row" key={rule.id}><div><strong>{rule.customerType}</strong><small>{rule.billingPeriod}{rule.description ? ` · ${rule.description}` : ''}</small></div><strong>RWF {money.format(rule.amount)}</strong><span className={`company-status ${rule.active ? 'green' : 'coral'}`}>{rule.active ? 'Active' : 'Inactive'}</span><button className={rule.active ? 'cancel-action' : 'approve-action'} onClick={() => void toggleRule(rule)}>{rule.active ? 'Deactivate' : 'Activate'}</button></div>)}
    </section>
  </>
}