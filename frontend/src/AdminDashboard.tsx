import { useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight, Building2, CalendarDays, CheckCircle2, Clock3, CreditCard, MapPin, RefreshCw, Truck, Users, Wallet } from 'lucide-react'
import './AdminDashboard.css'

type AdminDashboardProps = { token: string; onOpen: (view: string) => void }
type CollectionDay = { date: string; total: number; completed: number }
type RecentCollection = { id: string; customer: string; address: string; driver: string; time: string | null; status: string; date: string }
type RecentPayment = { id: string; customer: string; amount: number; method: string; reference: string; paidAt: string }
type Summary = {
  collectionsToday: number
  completedThisWeek: number
  activeHouseholds: number
  accountsWithBalance: number
  outstandingBalance: number
  paymentsThisMonth: number
  paymentCountThisMonth: number
  companiesTotal: number
  companiesApproved: number
  companiesPending: number
  companiesCancelled: number
  weeklyCollections: CollectionDay[]
  recentCollections: RecentCollection[]
  recentPayments: RecentPayment[]
  pendingCompanyRecords: Array<{ id: string; name: string; location: string }>
}

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'
const numberFormat = new Intl.NumberFormat('en-RW')
const currencyFormat = new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 })
const shortDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
const shortDateTime = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function AdminDashboard({ token, onOpen }: AdminDashboardProps) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    void fetch(`${apiBase}/api/dashboard/summary`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as Summary | { error?: string }
        if (!response.ok) throw new Error('error' in result ? result.error : 'Dashboard data could not be loaded.')
        setSummary(result as Summary)
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error ? requestError.message : 'Dashboard data could not be loaded.')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [reloadKey, token])

  const maxCollections = Math.max(1, ...(summary?.weeklyCollections.map((day) => day.total) ?? []))
  const dateToday = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())

  return <div className="operations-dashboard">
    <header className="dashboard-heading">
      <div>
        <p className="dashboard-eyebrow"><span /> ECOROUTE OPERATIONS</p>
        <h1>Operations overview</h1>
        <p className="dashboard-date"><CalendarDays size={14} /> {dateToday}</p>
      </div>
      <div className="dashboard-heading-actions">
        <span className={`dashboard-live ${error ? 'is-offline' : ''}`}><i /> {error ? 'Connection issue' : loading ? 'Syncing records' : 'Database live'}</span>
        <button className="dashboard-refresh" onClick={() => setReloadKey((key) => key + 1)} aria-label="Refresh dashboard" title="Refresh dashboard"><RefreshCw size={16} /></button>
      </div>
    </header>

    {error && <div className="dashboard-error" role="alert">{error} <button onClick={() => setReloadKey((key) => key + 1)}>Retry</button></div>}

    <section className="dashboard-metrics" aria-label="Platform metrics">
      <Metric icon={<Truck size={17} />} label="Collections today" value={loading && !summary ? '—' : numberFormat.format(summary?.collectionsToday ?? 0)} detail={`${numberFormat.format(summary?.completedThisWeek ?? 0)} completed this week`} tone="green" />
      <Metric icon={<Users size={17} />} label="Active households" value={loading && !summary ? '—' : numberFormat.format(summary?.activeHouseholds ?? 0)} detail="Customer service accounts" tone="blue" />
      <Metric icon={<Wallet size={17} />} label="Outstanding balance" value={loading && !summary ? '—' : currencyFormat.format(summary?.outstandingBalance ?? 0)} detail={`${numberFormat.format(summary?.accountsWithBalance ?? 0)} accounts with a balance`} tone="amber" />
      <Metric icon={<CreditCard size={17} />} label="Payments this month" value={loading && !summary ? '—' : currencyFormat.format(summary?.paymentsThisMonth ?? 0)} detail={`${numberFormat.format(summary?.paymentCountThisMonth ?? 0)} recorded transactions`} tone="coral" />
    </section>

    <section className="dashboard-primary-grid">
      <article className="dashboard-panel collection-chart-panel">
        <div className="dashboard-panel-heading">
          <div><p className="dashboard-panel-kicker">COLLECTIONS</p><h2>Weekly activity</h2><p>Scheduled collection records, last 7 days</p></div>
          <span className="dashboard-panel-stat"><strong>{numberFormat.format(summary?.weeklyCollections.reduce((total, day) => total + day.total, 0) ?? 0)}</strong><small>total visits</small></span>
        </div>
        <div className="dashboard-chart" role="img" aria-label="Daily collections over the last seven days">
          {(summary?.weeklyCollections ?? []).map((day) => {
            const height = day.total ? Math.max(9, (day.total / maxCollections) * 100) : 3
            const completedHeight = day.total ? `${(day.completed / day.total) * 100}%` : '0%'
            return <div className="dashboard-chart-day" key={day.date} title={`${numberFormat.format(day.total)} collections, ${numberFormat.format(day.completed)} completed`}>
              <span className="dashboard-chart-count">{day.total || ''}</span>
              <div className="dashboard-chart-track"><span className="dashboard-chart-bar" style={{ height: `${height}%` }}><i style={{ height: completedHeight }} /></span></div>
              <small>{shortDate.format(new Date(`${day.date}T12:00:00`))}</small>
            </div>
          })}
          {!summary && <div className="dashboard-chart-empty">{loading ? 'Loading collection history...' : 'Collection history is unavailable.'}</div>}
        </div>
        <div className="dashboard-chart-legend"><span><i className="legend-total" /> Scheduled</span><span><i className="legend-completed" /> Completed</span></div>
      </article>

      <article className="dashboard-panel approvals-panel">
        <div className="dashboard-panel-heading">
          <div><p className="dashboard-panel-kicker">COMPANY NETWORK</p><h2>Approval queue</h2><p>{numberFormat.format(summary?.companiesPending ?? 0)} applications awaiting review</p></div>
          <span className="approval-count">{numberFormat.format(summary?.companiesPending ?? 0)}</span>
        </div>
        <div className="approval-list">
          {summary?.pendingCompanyRecords.length ? summary.pendingCompanyRecords.map((company) => <div className="approval-item" key={company.id}>
            <span className="approval-symbol"><Building2 size={16} /></span>
            <span className="approval-copy"><strong>{company.name}</strong><small><MapPin size={11} /> {company.location}</small></span>
            <span className="approval-status">Pending</span>
          </div>) : <div className="dashboard-empty"><CheckCircle2 size={19} /><span>{summary ? 'No applications need review' : loading ? 'Loading approvals...' : 'Approvals are unavailable'}</span></div>}
        </div>
        <div className="company-totals">
          <span><i className="status-approved" /> Approved <strong>{numberFormat.format(summary?.companiesApproved ?? 0)}</strong></span>
          <span><i className="status-cancelled" /> Cancelled <strong>{numberFormat.format(summary?.companiesCancelled ?? 0)}</strong></span>
        </div>
        <button className="dashboard-link" onClick={() => onOpen('Companies')}>Manage companies <ArrowUpRight size={15} /></button>
      </article>
    </section>

    <section className="dashboard-secondary-grid">
      <article className="dashboard-panel records-panel">
        <div className="dashboard-panel-heading dashboard-records-heading">
          <div><p className="dashboard-panel-kicker">FIELD ACTIVITY</p><h2>Recent collections</h2><p>Latest scheduled service records</p></div>
          <span className="records-heading-icon"><Truck size={17} /></span>
        </div>
        {summary?.recentCollections.length ? <div className="dashboard-record-list">
          {summary.recentCollections.map((collection) => <div className="collection-record" key={collection.id}>
            <span className="record-time"><strong>{collection.time || '—'}</strong><small>{collection.date ? shortDate.format(new Date(`${collection.date}T12:00:00`)) : 'No date'}</small></span>
            <span className="record-main"><strong>{collection.customer}</strong><small><MapPin size={11} /> {collection.address}</small></span>
            <span className={`record-status status-${collection.status.toLowerCase().replaceAll(' ', '-')}`}>{collection.status}</span>
          </div>)}
        </div> : <div className="dashboard-empty records-empty"><Clock3 size={18} /><span>{summary ? 'No collection records yet' : loading ? 'Loading collections...' : 'Collections are unavailable'}</span></div>}
      </article>

      <article className="dashboard-panel records-panel payments-panel">
        <div className="dashboard-panel-heading dashboard-records-heading">
          <div><p className="dashboard-panel-kicker">PAYMENTS</p><h2>Latest transactions</h2><p>Recorded customer payments</p></div>
          <span className="records-heading-icon payment-heading-icon"><CreditCard size={17} /></span>
        </div>
        {summary?.recentPayments.length ? <div className="dashboard-record-list">
          {summary.recentPayments.map((payment) => <div className="payment-record" key={payment.id}>
            <span className="payment-mark"><CreditCard size={14} /></span>
            <span className="record-main"><strong>{payment.customer}</strong><small>{payment.reference} · {payment.method}</small></span>
            <span className="payment-amount"><strong>{currencyFormat.format(payment.amount)}</strong><small>{shortDateTime.format(new Date(payment.paidAt))}</small></span>
          </div>)}
        </div> : <div className="dashboard-empty records-empty"><CreditCard size={18} /><span>{summary ? 'No payments recorded yet' : loading ? 'Loading payments...' : 'Payments are unavailable'}</span></div>}
      </article>
    </section>
  </div>
}

function Metric({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className={`dashboard-metric ${tone}`}>
    <div className="metric-top"><span className="metric-icon">{icon}</span><span className="metric-dots" aria-hidden="true">•••</span></div>
    <small>{label}</small><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span>
  </article>
}
