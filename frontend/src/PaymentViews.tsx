import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Check, CreditCard, Download, FileCheck2, Plus, Printer, Search, X } from 'lucide-react'
import { companyFetch } from './companyApi'
import './App.css'

type Customer = { id: string; name: string; phone?: string; location: string; plan: string; balance: string; status: string }
type Payment = { id: string; customerId: string; customer: string; amount: number; method: string; reference: string; paidAt: string }
const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'
const formatRwfAmount = new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 })
const currency = (amount: number) => `RWF ${formatRwfAmount.format(amount)}`
const formatDate = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

async function fetchCompanyPaymentData(companyId: string) {
  const [customersResponse, paymentsResponse] = await Promise.all([
    companyFetch(`/api/customers?companyId=${encodeURIComponent(companyId)}`),
    companyFetch(`/api/payments?companyId=${encodeURIComponent(companyId)}`),
  ])
  const [customerData, paymentData] = await Promise.all([
    customersResponse.json() as Promise<Customer[] | { error?: string }>,
    paymentsResponse.json() as Promise<Payment[] | { error?: string }>,
  ])
  if (!customersResponse.ok) throw new Error('error' in customerData ? customerData.error : 'Customers could not be loaded')
  if (!paymentsResponse.ok) throw new Error('error' in paymentData ? paymentData.error : 'Payments could not be loaded')
  return { customers: customerData as Customer[], payments: paymentData as Payment[] }
}

export function CompanyPaymentsView({ companyId }: { companyId: string }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadData = async () => {
    try {
      const data = await fetchCompanyPaymentData(companyId)
      setCustomers(data.customers)
      setPayments(data.payments)
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Payments could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    void fetchCompanyPaymentData(companyId)
      .then((data) => {
        if (!active) return
        setCustomers(data.customers)
        setPayments(data.payments)
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Payments could not be loaded')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [companyId])

  const totalOutstanding = customers.reduce((total, customer) => total + parseFloat(customer.balance.replace(/[^0-9.]/g, '') || '0'), 0)
  const totalCollected = payments.reduce((total, payment) => total + payment.amount, 0)
  const filteredPayments = payments.filter((payment) => `${payment.customer} ${payment.reference} ${payment.method}`.toLowerCase().includes(query.toLowerCase()))
  const filteredCustomers = customers.filter((customer) => customer.name.toLowerCase().includes(query.toLowerCase()))

  return <>
    <div className="admin-heading">
      <div><p className="section-kicker"><span className="kicker-line" /> FINANCIAL OPERATIONS</p><h1>Payments</h1><p>Balances, collections and payment history in one place.</p></div>
      <button className="admin-action" onClick={() => { setNotice(''); setShowForm(true) }}><Plus size={14} /> Record payment</button>
    </div>
    {error && <p className="settings-error company-error">{error}</p>}
    {notice && <p className="payment-notice"><Check size={15} />{notice}</p>}
    <section className="payment-summary">
      <article className="payment-summary-card collected"><span><ArrowDownLeft size={17} /></span><small>Collected to date</small><strong>{loading ? '...' : currency(totalCollected)}</strong><em>{payments.length} recorded payments</em></article>
      <article className="payment-summary-card outstanding"><span><ArrowUpRight size={17} /></span><small>Outstanding balance</small><strong>{loading ? '...' : currency(totalOutstanding)}</strong><em>{customers.filter((customer) => parseFloat(customer.balance.replace(/[^0-9.]/g, '') || '0') > 0).length} accounts owing</em></article>
      <article className="payment-summary-card accounts"><span><CreditCard size={17} /></span><small>Customer accounts</small><strong>{loading ? '...' : customers.length}</strong><em>{customers.filter((customer) => customer.status === 'Active').length} active accounts</em></article>
    </section>
    <section className="admin-panel payment-table-panel">
      <div className="payment-table-heading"><div><h2>Payment activity</h2><p>Recorded transactions and account balances</p></div><label className="payment-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer or reference" aria-label="Search payments" /></label></div>
      {loading ? <p className="company-loading">Loading payment records...</p> : <>
        <div className="payment-table-wrap"><table className="payment-table"><thead><tr><th>Customer</th><th>Reference</th><th>Date</th><th>Method</th><th>Amount</th></tr></thead><tbody>
          {filteredPayments.map((payment) => <tr key={payment.id}><td><strong>{payment.customer}</strong><small>Payment received</small></td><td><code>{payment.reference}</code></td><td>{formatDate(payment.paidAt)}</td><td><span className="payment-method">{payment.method}</span></td><td className="payment-amount">{currency(payment.amount)}</td></tr>)}
          {filteredPayments.length === 0 && <tr><td colSpan={5} className="payment-empty">No payment transactions found.</td></tr>}
        </tbody></table></div>
      </>}
    </section>
    <section className="admin-panel payment-accounts-panel">
      <div className="admin-panel-heading"><div><h2>Customer balances</h2><p>Outstanding amount by account</p></div><span className="payment-count">{filteredCustomers.length} accounts</span></div>
      {filteredCustomers.map((customer) => {
        const balance = parseFloat(customer.balance.replace(/[^0-9.]/g, '') || '0')
        return <div className="payment-account-row" key={customer.id}><span className="payment-customer-mark">{customer.name.slice(0, 2).toUpperCase()}</span><div className="payment-account-name"><strong>{customer.name}</strong><small>{customer.plan} · {customer.status}</small></div><div className="payment-account-balance"><small>Outstanding</small><strong className={balance > 0 ? 'is-due' : ''}>{currency(balance)}</strong></div><button className="payment-row-action" disabled={balance <= 0} onClick={() => { setNotice(''); setShowForm(true) }} title={`Record payment for ${customer.name}`}><Plus size={14} /> Record</button></div>
      })}
      {!loading && filteredCustomers.length === 0 && <p className="company-loading">No customer accounts found.</p>}
    </section>
    {showForm && <RecordPaymentDialog companyId={companyId} customers={customers.filter((customer) => parseFloat(customer.balance.replace(/[^0-9.]/g, '') || '0') > 0)} onClose={() => setShowForm(false)} onSaved={async () => { setShowForm(false); setNotice('Payment recorded and balance updated.'); await loadData() }} />}
  </>
}

function RecordPaymentDialog({ companyId, customers, onClose, onSaved }: { companyId: string; customers: Customer[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Mobile money')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const selectedCustomer = customers.find((customer) => customer.id === customerId)
  const maxBalance = selectedCustomer ? parseFloat(selectedCustomer.balance.replace(/[^0-9.]/g, '') || '0') : 0

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = Number(amount)
    if (!customerId || !Number.isInteger(value) || value <= 0 || value > maxBalance) { setError('Enter a whole RWF amount up to the customer’s outstanding balance.'); return }
    setSubmitting(true)
    setError('')
    try {
      const response = await companyFetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId, companyId, amount: value, method }) })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Payment could not be recorded')
      await onSaved()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Payment could not be recorded')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="company-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="company-modal payment-dialog"><button className="company-modal-close" onClick={onClose} aria-label="Close payment dialog"><X size={18} /></button><p className="section-kicker"><span className="kicker-line" /> NEW TRANSACTION</p><h2>Record payment</h2>{customers.length === 0 ? <><p className="payment-dialog-copy">All customer balances are settled. There is nothing to collect.</p><div className="company-modal-actions"><button className="dialog-primary" onClick={onClose}>Done</button></div></> : <form onSubmit={submitPayment}><div className="form-group"><label htmlFor="payment-customer">Customer</label><select id="payment-customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.balance}</option>)}</select></div><div className="payment-due-line"><span>Outstanding balance</span><strong>{currency(maxBalance)}</strong></div><div className="form-group"><label htmlFor="payment-amount">Amount received (RWF)</label><input id="payment-amount" type="number" min="1" max={maxBalance} step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" required /></div><div className="form-group"><label htmlFor="payment-method">Payment method</label><select id="payment-method" value={method} onChange={(event) => setMethod(event.target.value)}><option>Mobile money</option><option>Cash</option><option>Card</option><option>Bank transfer</option></select></div>{error && <p className="settings-error">{error}</p>}<div className="company-modal-actions"><button type="button" className="dialog-cancel" onClick={onClose}>Cancel</button><button type="submit" className="dialog-primary" disabled={submitting}>{submitting ? 'Recording...' : 'Record payment'}</button></div></form>}</section></div>
}

export function CustomerPaymentsView({ customer }: { customer: Customer | null }) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const balance = customer ? parseFloat(customer.balance.replace(/[^0-9.]/g, '') || '0') : 0
  const accountPayments = payments.filter((payment) => payment.customerId === customer?.id)
  const paidTotal = accountPayments.reduce((total, payment) => total + payment.amount, 0)

  useEffect(() => {
    if (!customer?.id) return
    void fetch(`${apiBase}/api/payments?customerId=${encodeURIComponent(customer.id)}`)
      .then(async (response) => {
        const result = await response.json() as Payment[] | { error?: string }
        if (!response.ok) throw new Error('error' in result ? result.error : 'Payment history could not be loaded')
        setPayments(result as Payment[])
      })
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Payment history could not be loaded'))
      .finally(() => setLoading(false))
  }, [customer?.id])

  return <>
    <div className="customer-heading"><div><p className="section-kicker"><span className="kicker-line" /> ACCOUNT &amp; BILLING</p><h1>Payments</h1><p>Review your outstanding balance and payment receipts.</p></div><span className="service-badge"><i /> {balance > 0 ? 'Balance due' : 'Account settled'}</span></div>
    {error && <p className="settings-error">{error}</p>}
    <section className="customer-payment-summary"><article><span><CreditCard size={17} /></span><small>Outstanding balance</small><strong>{currency(balance)}</strong><em>{balance > 0 ? 'Due to your collection provider' : 'No payment is currently due'}</em></article><article><span><ArrowDownLeft size={17} /></span><small>Paid in this account</small><strong>{currency(paidTotal)}</strong><em>{accountPayments.length} payment receipts</em></article><article><span><CalendarDays size={17} /></span><small>Service plan</small><strong className="customer-plan-value">{customer?.plan ?? 'No active plan'}</strong><em>{customer?.status ?? 'Account unavailable'}</em></article></section>
    <section className="customer-panel customer-payment-history"><div className="customer-panel-heading"><div><h2>Payment history</h2><p>Completed payments and receipt references</p></div><Download size={18} /></div>{loading ? <p className="company-loading">Loading payment history...</p> : accountPayments.length === 0 ? <div className="customer-payment-empty"><span><CreditCard size={19} /></span><strong>No payments yet</strong><p>Your recorded payments and receipts will appear here.</p></div> : accountPayments.map((payment) => <div className="customer-payment-row" key={payment.id}><span className="customer-payment-icon"><Check size={16} /></span><div><strong>{payment.method} payment</strong><small>{formatDate(payment.paidAt)} · {payment.reference}</small></div><strong>{currency(payment.amount)}</strong></div>)}</section>
  </>
}

export function CustomerReceiptsView({ customer }: { customer: Customer | null }) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null)
  const receipts = payments
    .filter((payment) => `${payment.reference} ${payment.method}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
  const totalPaid = payments.reduce((total, payment) => total + payment.amount, 0)

  useEffect(() => {
    if (!customer?.id) return
    void fetch(`${apiBase}/api/payments?customerId=${encodeURIComponent(customer.id)}`)
      .then(async (response) => {
        const result = await response.json() as Payment[] | { error?: string }
        if (!response.ok) throw new Error('error' in result ? result.error : 'Receipts could not be loaded')
        setPayments(result as Payment[])
      })
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Receipts could not be loaded'))
      .finally(() => setLoading(false))
  }, [customer?.id])

  return <>
    <div className="customer-heading"><div><p className="section-kicker"><span className="kicker-line" /> ACCOUNT &amp; BILLING</p><h1>Receipts</h1><p>Payment records and printable receipts for your account.</p></div><span className="service-badge"><i /> {payments.length} receipts</span></div>
    {error && <p className="settings-error">{error}</p>}
    <section className="customer-receipt-summary"><span><FileCheck2 size={18} /></span><div><small>Total paid</small><strong>{currency(totalPaid)}</strong></div><div><small>Receipts</small><strong>{payments.length}</strong></div><div><small>Account holder</small><strong>{customer?.name ?? 'Household account'}</strong></div></section>
    <section className="customer-panel customer-payment-history receipt-list-panel"><div className="customer-panel-heading"><div><h2>Issued receipts</h2><p>Each receipt is linked to a recorded payment</p></div><label className="payment-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a receipt" aria-label="Search receipts" /></label></div>
      {loading ? <p className="company-loading">Loading receipts...</p> : receipts.length === 0 ? <div className="customer-payment-empty"><span><FileCheck2 size={19} /></span><strong>{payments.length ? 'No receipts match' : 'No receipts issued yet'}</strong><p>{payments.length ? 'Try another reference or payment method.' : 'Your receipt will appear here when a payment is recorded.'}</p></div> : receipts.map((payment) => <article className="receipt-row" key={payment.id}><span className="customer-payment-icon"><FileCheck2 size={16} /></span><div className="receipt-row-info"><strong>{payment.reference}</strong><small>{formatDate(payment.paidAt)} · {payment.method}</small></div><strong className="receipt-row-amount">{currency(payment.amount)}</strong><button className="receipt-open-button" onClick={() => setSelectedReceipt(payment)}>View receipt <ArrowUpRight size={14} /></button></article>)}
    </section>
    {selectedReceipt && <div className="company-modal-backdrop receipt-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedReceipt(null) }}><section className="company-modal receipt-paper"><button className="company-modal-close no-print" onClick={() => setSelectedReceipt(null)} aria-label="Close receipt"><X size={18} /></button><div className="receipt-brand"><span><FileCheck2 size={20} /></span><div><strong>EcoRoute</strong><small>Payment receipt</small></div></div><div className="receipt-paid-stamp"><Check size={13} /> PAID</div><h2>Payment receipt</h2><p className="receipt-reference">{selectedReceipt.reference}</p><div className="receipt-total"><small>Amount received</small><strong>{currency(selectedReceipt.amount)}</strong></div><dl className="receipt-details"><div><dt>Received from</dt><dd>{selectedReceipt.customer || customer?.name || 'Household account'}</dd></div><div><dt>Payment date</dt><dd>{formatDate(selectedReceipt.paidAt)}</dd></div><div><dt>Payment method</dt><dd>{selectedReceipt.method}</dd></div><div><dt>Transaction ID</dt><dd>{selectedReceipt.id}</dd></div></dl><p className="receipt-footer-note">This receipt confirms the payment recorded by EcoRoute.</p><button className="dialog-primary receipt-print-button no-print" onClick={() => window.print()}><Printer size={15} /> Print receipt</button></section></div>}
  </>
}