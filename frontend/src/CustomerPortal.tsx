import { useEffect, useState } from 'react'
import { ArrowRight, Bell, Bot, CalendarDays, ChevronRight, Clock3, CreditCard, House, Leaf, LogOut, MapPin, MessageCircle, PackageCheck, Receipt, Settings } from 'lucide-react'
import './App.css'

type CustomerPortalProps = { onLogout: () => void }
type Customer = { id: string; name: string; phone?: string; location: string; plan: string; balance: string; status: string }
type Collection = { id: string; time: string; date: string; address: string; customer: string; driver: string; vehicle: string; status: string }
const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

const navigation = [
  { label: 'Dashboard', icon: House },
  { label: 'My Collections', icon: CalendarDays },
  { label: 'My Location', icon: MapPin },
  { label: 'Payments', icon: CreditCard },
  { label: 'Receipts', icon: Receipt },
  { label: 'Notifications', icon: Bell },
  { label: 'Messages', icon: MessageCircle },
  { label: 'AI Assistant', icon: Bot },
  { label: 'Settings', icon: Settings },
]

const viewCopy: Record<string, { title: string; subtitle: string }> = {
  Dashboard: { title: 'Good morning, Kilimani Estate', subtitle: 'Here is the latest information about your waste collection service.' },
  'My Collections': { title: 'My Collections', subtitle: 'Your upcoming and completed waste collection visits.' },
  'My Location': { title: 'My Location', subtitle: 'Your registered service location and collection zone.' },
  Payments: { title: 'Payments', subtitle: 'Review balances, payment history and due dates.' },
  Receipts: { title: 'Receipts', subtitle: 'Your digital payment receipts and invoices.' },
  Notifications: { title: 'Notifications', subtitle: 'Collection reminders and service updates from your company.' },
  Messages: { title: 'Messages', subtitle: 'Communicate directly with your waste collection company.' },
  'AI Assistant': { title: 'AI Assistant', subtitle: 'Ask about your schedule, payments or service history.' },
  Settings: { title: 'Settings', subtitle: 'Manage your household profile and notification preferences.' },
}

export default function CustomerPortal({ onLogout }: CustomerPortalProps) {
  const [activeView, setActiveView] = useState('Dashboard')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const current = viewCopy[activeView]

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [customerRes, collectionsRes] = await Promise.all([
        fetch(`${apiBase}/api/customers`),
        fetch(`${apiBase}/api/collections`)
      ])
      const [customerData, collectionsData] = await Promise.all([
        customerRes.json() as Customer[] | { error?: string },
        collectionsRes.json() as Collection[] | { error?: string }
      ])
      if (!customerRes.ok) throw new Error('error' in customerData ? customerData.error : 'Customer data could not be loaded')
      if (!collectionsRes.ok) throw new Error('error' in collectionsData ? collectionsData.error : 'Collections could not be loaded')
      const customers = customerData as Customer[]
      setCustomer(customers.find((c) => c.status === 'Active') ?? customers[0] ?? null)
      setCollections(collectionsData as Collection[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Data could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  return <div className="customer-portal"><aside className="customer-sidebar"><a href="#top" className="site-logo"><span className="logo-mark"><Leaf size={17} /></span><span><strong>Isuku Route</strong><small>AI-Powered EcoRoute</small></span></a><p className="portal-label">Household workspace</p><nav className="customer-nav">{navigation.map(({ label, icon: Icon }) => <button key={label} className={activeView === label ? 'active' : ''} onClick={() => setActiveView(label)}><Icon size={17} /><span>{label}</span>{label === 'Notifications' && <i />}</button>)}</nav><button className="customer-logout" onClick={onLogout}><LogOut size={17} /> Logout</button></aside><main className="customer-main"><header className="customer-topbar"><div><span className="portal-breadcrumb">Household /</span> {activeView}</div><div className="customer-user"><span className="customer-avatar">{customer?.name.slice(0, 2).toUpperCase() ?? 'CU'}</span><span><strong>{customer?.name ?? 'Loading...'}</strong><small>{customer?.status === 'Active' ? 'Active household' : 'Loading...'}</small></span><ChevronRight size={15} /></div></header><div className="customer-content"><div className="customer-heading"><div><p className="section-kicker"><span className="kicker-line" /> HOUSEHOLD WORKSPACE</p><h1>{customer ? `Good morning, ${customer.name}` : current.title}</h1><p>{customer ? 'Here is the latest information about your waste collection service.' : current.subtitle}</p></div><span className="service-badge"><i /> {customer?.status === 'Active' ? 'Service active' : 'Loading...'}</span></div>{error && <p className="settings-error">{error}</p>}{loading ? <p>Loading...</p> : activeView === 'Dashboard' ? <CustomerDashboard customer={customer} collections={collections} onOpen={setActiveView} /> : <CustomerView title={current.title} view={activeView} />}</div></main></div>
}

function CustomerDashboard({ customer, collections, onOpen }: { customer: Customer | null; collections: Collection[]; onOpen: (view: string) => void }) {
  const nextCollection = collections.find((c) => c.status === 'Scheduled' || c.status === 'In Progress')
  const completedCollections = collections.filter((c) => c.status === 'Completed').slice(0, 3)
  const nextCollectionDate = nextCollection ? new Date(nextCollection.date) : null
  const formattedDate = nextCollectionDate ? nextCollectionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'No scheduled collection'
  const formattedTime = nextCollection?.time ?? '--'
  const locationParts = customer?.location.split('·') ?? ['Unknown location']

  return <>
    <section className="customer-metrics">
      <div><span><CalendarDays size={16} /></span><small>Next collection</small><strong>{formattedDate}</strong><em>{formattedTime} · {customer?.name ?? 'Unknown route'}</em></div>
      <div><span><CreditCard size={16} /></span><small>Outstanding balance</small><strong>{customer?.balance ?? '$0.00'}</strong><em>{customer?.balance !== '$0.00' ? 'Due soon' : 'No balance due'}</em></div>
      <div><span><PackageCheck size={16} /></span><small>Service plan</small><strong>{customer?.plan.split('·')[0].trim() ?? 'Weekly'}</strong><em>{customer?.plan.split('·')[1]?.trim() ?? '240 kg capacity'}</em></div>
    </section>
    <section className="customer-grid">
      <article className="customer-panel next-visit">
        <div className="customer-panel-heading"><div><h2>Next collection</h2><p>Your upcoming service visit</p></div><span className={`scheduled-pill ${nextCollection?.status === 'In Progress' ? 'in-progress' : ''}`}>{nextCollection?.status ?? 'No scheduled collection'}</span></div>
        {nextCollection ? <><div className="visit-date"><strong>{nextCollectionDate?.getDate() ?? '--'}</strong><span><b>{nextCollectionDate?.toLocaleDateString('en-US', { weekday: 'long' }) ?? '--'}</b><small>{nextCollectionDate?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) ?? '--'}</small></span></div><div className="visit-details"><span><Clock3 size={15} /> {formattedTime}</span><span><MapPin size={15} /> {nextCollection.address}</span></div></> : <p className="no-collection">No upcoming collections scheduled</p>}
        <button className="panel-link" onClick={() => onOpen('My Collections')}>View collection details <ArrowRight size={15} /></button>
      </article>
      <article className="customer-panel location-card">
        <div className="customer-panel-heading"><div><h2>My location</h2><p>Registered service point</p></div><MapPin size={19} /></div>
        <div className="location-lines"><strong>{customer?.name ?? 'Unknown'}</strong>{locationParts.map((part, i) => <span key={i}>{part.trim()}</span>)}</div>
        <button className="panel-link" onClick={() => onOpen('My Location')}>View location <ArrowRight size={15} /></button>
      </article>
    </section>
    <section className="customer-grid lower-customer">
      <article className="customer-panel history-card">
        <div className="customer-panel-heading"><div><h2>Recent collection history</h2><p>Your last three service visits</p></div><button className="panel-link" onClick={() => onOpen('My Collections')}>View all</button></div>
        {completedCollections.length > 0 ? completedCollections.map((collection) => {
          const date = new Date(collection.date)
          const formattedHistoryDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return <div className="history-row" key={collection.id}><span>{formattedHistoryDate}</span><strong>{collection.customer} collection</strong><em>{collection.status}</em></div>
        }) : <p className="no-history">No collection history yet</p>}
      </article>
      <article className="customer-panel assistant-card">
        <div className="assistant-icon"><Bot size={20} /></div>
        <h2>Ask EcoRoute AI</h2>
        <p>Get answers from your actual service records.</p>
        <button className="assistant-button" onClick={() => onOpen('AI Assistant')}>Ask a question <ArrowRight size={15} /></button>
      </article>
    </section>
  </>
}

function CustomerView({ title, view }: { title: string; view: string }) { return <section className="customer-panel customer-empty-view"><div className="customer-view-icon">{view === 'AI Assistant' ? <Bot /> : view === 'Payments' ? <CreditCard /> : view === 'Receipts' ? <Receipt /> : view === 'Notifications' ? <Bell /> : view === 'Messages' ? <MessageCircle /> : view === 'My Location' ? <MapPin /> : view === 'Settings' ? <Settings /> : <CalendarDays />}</div><h2>{title}</h2><p>This workspace view is connected to your household account. Records and actions will appear here as your company publishes them.</p><button className="panel-link">Contact collection company <ArrowRight size={15} /></button></section> }
