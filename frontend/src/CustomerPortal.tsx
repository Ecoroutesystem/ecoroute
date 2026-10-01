import { lazy, Suspense, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowRight, Bell, Bot, CalendarDays, Camera, Check, ChevronRight, Clock3, CreditCard, ExternalLink, House, KeyRound, Leaf, LogOut, MapPin, Menu, MessageCircle, PackageCheck, Receipt, Search, Settings, Truck, UserCircle2, X } from 'lucide-react'
import { CustomerPaymentsView, CustomerReceiptsView } from './PaymentViews'
import { CustomerMessagesView, CustomerNotificationsView } from './CustomerCommunications'
import CustomerAssistant from './CustomerAssistant'
import './App.css'

type CustomerPortalProps = { customerId: string; onLogout: () => void }
type Customer = { id: string; name: string; phone?: string; location: string; latitude?: number | null; longitude?: number | null; plan: string; balance: string; status: string }
type Collection = { id: string; time: string; date: string; address: string; customer: string; driver: string; vehicle: string; status: string }
const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const CustomerLocationMap = lazy(() => import('./CustomerLocationMap'))

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

export default function CustomerPortal({ customerId, onLogout }: CustomerPortalProps) {
  const [activeView, setActiveView] = useState('Dashboard')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [profilePhoto, setProfilePhoto] = useState('')
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const current = viewCopy[activeView]

  useEffect(() => {
    let active = true
    void Promise.all([
      fetch(`${apiBase}/api/customers${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ''}`),
      fetch(`${apiBase}/api/collections`),
    ])
      .then(async ([customerRes, collectionsRes]) => {
        const [customerData, collectionsData] = await Promise.all([
          customerRes.json() as Promise<Customer[] | { error?: string }>,
          collectionsRes.json() as Promise<Collection[] | { error?: string }>,
        ])
        if (!customerRes.ok) throw new Error('error' in customerData ? customerData.error : 'Customer data could not be loaded')
        if (!collectionsRes.ok) throw new Error('error' in collectionsData ? collectionsData.error : 'Collections could not be loaded')
        if (!active) return
        const customers = customerData as Customer[]
        const selectedCustomer = customers.find((item) => item.status === 'Active') ?? customers[0] ?? null
        setCustomer(selectedCustomer)
        if (selectedCustomer) {
          try {
            const savedPreferences = localStorage.getItem(`ecoroute-customer-settings-${selectedCustomer.id}`)
            setProfilePhoto(savedPreferences ? (JSON.parse(savedPreferences) as Partial<CustomerPreferences>).photo ?? '' : '')
          } catch {
            setProfilePhoto('')
          }
        }
        setCollections((collectionsData as Collection[]).filter((item) => !selectedCustomer || item.customer.toLowerCase() === selectedCustomer.name.toLowerCase()))
        setError('')
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Data could not be loaded')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [customerId])

  return <div className="customer-portal"><aside className={`customer-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}><div className="customer-sidebar-head"><a href="#top" className="site-logo"><span className="logo-mark"><Leaf size={17} /></span><span><strong>Isuku Route</strong><small>AI-Powered EcoRoute</small></span></a><button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenuOpen}><span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>{mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}</button></div><p className="portal-label">Household workspace</p><nav className="customer-nav">{navigation.map(({ label, icon: Icon }) => <button key={label} className={activeView === label ? 'active' : ''} onClick={() => { setActiveView(label); setMobileMenuOpen(false) }}><Icon size={17} /><span>{label}</span>{label === 'Notifications' && <i />}</button>)}</nav><button className="customer-logout" onClick={onLogout}><LogOut size={17} /> Logout</button></aside><main className="customer-main"><header className="customer-topbar"><div><span className="portal-breadcrumb">Household /</span> {activeView}</div><div className="customer-user"><span className="customer-avatar">{profilePhoto ? <img src={profilePhoto} alt="" /> : customer?.name.slice(0, 2).toUpperCase() ?? 'CU'}</span><span><strong>{customer?.name ?? 'Loading...'}</strong><small>{customer?.status === 'Active' ? 'Active household' : 'Loading...'}</small></span><ChevronRight size={15} /></div></header><div className="customer-content">{activeView === 'Payments' ? <CustomerPaymentsView customer={customer} /> : activeView === 'Receipts' ? <CustomerReceiptsView customer={customer} /> : activeView === 'Notifications' ? <CustomerNotificationsView customer={customer} collections={collections} onOpen={(view) => { setActiveView(view); setMobileMenuOpen(false) }} /> : activeView === 'Messages' ? <CustomerMessagesView customer={customer} /> : activeView === 'Settings' ? <CustomerSettingsView customer={customer} onPhotoChange={setProfilePhoto} /> : <><div className="customer-heading"><div><p className="section-kicker"><span className="kicker-line" /> HOUSEHOLD WORKSPACE</p><h1>{activeView === 'Dashboard' && customer ? `Good morning, ${customer.name}` : current.title}</h1><p>{activeView === 'Dashboard' && customer ? 'Here is the latest information about your waste collection service.' : current.subtitle}</p></div><span className="service-badge"><i /> {customer?.status === 'Active' ? 'Service active' : 'Loading...'}</span></div>{error && <p className="settings-error">{error}</p>}{loading ? <p>Loading...</p> : activeView === 'Dashboard' ? <CustomerDashboard customer={customer} collections={collections} onOpen={setActiveView} /> : activeView === 'My Collections' ? <CustomerCollectionsView collections={collections} /> : activeView === 'My Location' ? <CustomerLocationView customer={customer} /> : <CustomerView title={current.title} view={activeView} />}</>}</div></main></div>
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
      <div><span><CreditCard size={16} /></span><small>Outstanding balance</small><strong>{customer?.balance ?? 'RWF 0'}</strong><em>{customer && parseFloat(customer.balance.replace(/[^0-9.]/g, '') || '0') > 0 ? 'Due soon' : 'No balance due'}</em></div>
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

type CustomerPreferences = { email: string; phone: string; photo: string; collectionAlerts: boolean; paymentAlerts: boolean; serviceUpdates: boolean; preferredChannel: 'SMS' | 'Email' }

function CustomerSettingsView({ customer, onPhotoChange }: { customer: Customer | null; onPhotoChange: (photo: string) => void }) {
  const storageKey = `ecoroute-customer-settings-${customer?.id ?? 'guest'}`
  const [preferences, setPreferences] = useState<CustomerPreferences>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const stored = JSON.parse(saved) as Partial<CustomerPreferences>
        return { email: '', phone: customer?.phone ?? '', photo: '', collectionAlerts: true, paymentAlerts: true, serviceUpdates: true, preferredChannel: 'SMS', ...stored }
      }
    } catch {
      localStorage.removeItem(storageKey)
    }
    return { email: '', phone: customer?.phone ?? '', photo: '', collectionAlerts: true, paymentAlerts: true, serviceUpdates: true, preferredChannel: 'SMS' }
  })
  const [saved, setSaved] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setPasswordError('Choose an image file for your profile picture.'); return }
    if (file.size > 2 * 1024 * 1024) { setPasswordError('Profile pictures must be 2 MB or smaller.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreferences((current) => ({ ...current, photo: reader.result as string }))
        onPhotoChange(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const savePreferences = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    localStorage.setItem(storageKey, JSON.stringify(preferences))
    setSaved(true)
  }

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    if (!preferences.email.trim()) { setPasswordError('Enter your account email in Household profile first.'); return }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setPasswordError('New password and confirmation do not match.'); return }
    setPasswordSaving(true)
    try {
      const response = await fetch(`${apiBase}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: preferences.email, currentPassword, newPassword }),
      })
      const result = await response.json() as { error?: string; message?: string }
      if (!response.ok) throw new Error(result.error ?? 'Password could not be changed.')
      setPasswordMessage(result.message ?? 'Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (requestError) {
      setPasswordError(requestError instanceof Error ? requestError.message : 'Password could not be changed.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return <>
    <div className="customer-heading"><div><p className="section-kicker"><span className="kicker-line" /> ACCOUNT PREFERENCES</p><h1>Settings</h1><p>Manage your household contact details and service updates.</p></div><span className="service-badge"><i /> {customer?.status ?? 'Account'}</span></div>
    {saved && <p className="settings-success"><Check size={14} /> Preferences saved on this device.</p>}
    <form className="customer-settings-layout" onSubmit={savePreferences}>
      <section className="customer-panel customer-settings-section"><div className="settings-title"><span className="settings-icon"><UserCircle2 size={17} /></span><div><h2>Household profile</h2><p>Contact details for service notices and receipts.</p></div></div><div className="customer-profile-photo"><span className="customer-profile-preview">{preferences.photo ? <img src={preferences.photo} alt="Household profile" /> : customer?.name.slice(0, 2).toUpperCase() ?? 'CU'}</span><div><label className="upload-button"><Camera size={13} /> Change picture<input type="file" accept="image/*" onChange={handlePhotoChange} /></label><small>PNG, JPG or WEBP up to 2 MB</small></div></div><div className="customer-settings-fields"><label>Household name<input value={customer?.name ?? ''} readOnly /></label><label>Email address<input type="email" value={preferences.email} onChange={(event) => setPreferences({ ...preferences, email: event.target.value })} placeholder="name@example.com" required /></label><label>Phone number<input type="tel" value={preferences.phone} onChange={(event) => setPreferences({ ...preferences, phone: event.target.value })} placeholder="Add a contact number" /></label><label>Service location<input value={customer?.location ?? ''} readOnly /></label></div></section>
      <section className="customer-panel customer-settings-section"><div className="settings-title"><span className="settings-icon"><Bell size={17} /></span><div><h2>Notifications</h2><p>Choose the account updates you receive.</p></div></div><div className="customer-preference-list"><label><span><strong>Collection reminders</strong><small>Upcoming visit dates and schedule changes</small></span><input type="checkbox" checked={preferences.collectionAlerts} onChange={(event) => setPreferences({ ...preferences, collectionAlerts: event.target.checked })} /></label><label><span><strong>Payment updates</strong><small>Balance reminders and payment confirmations</small></span><input type="checkbox" checked={preferences.paymentAlerts} onChange={(event) => setPreferences({ ...preferences, paymentAlerts: event.target.checked })} /></label><label><span><strong>Service announcements</strong><small>Important updates from your collection company</small></span><input type="checkbox" checked={preferences.serviceUpdates} onChange={(event) => setPreferences({ ...preferences, serviceUpdates: event.target.checked })} /></label></div><fieldset className="customer-channel-picker"><legend>Preferred contact channel</legend><label><input type="radio" name="preferred-channel" value="SMS" checked={preferences.preferredChannel === 'SMS'} onChange={() => setPreferences({ ...preferences, preferredChannel: 'SMS' })} /> SMS</label><label><input type="radio" name="preferred-channel" value="Email" checked={preferences.preferredChannel === 'Email'} onChange={() => setPreferences({ ...preferences, preferredChannel: 'Email' })} /> Email</label></fieldset><button className="admin-save" type="submit">Save profile and preferences</button></section>
    </form>
    <form className="customer-panel customer-password-section" onSubmit={changePassword}><div className="settings-title"><span className="settings-icon"><KeyRound size={17} /></span><div><h2>Change password</h2><p>Verify your current password before choosing a new one.</p></div></div><div className="customer-password-fields"><label>Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /></label><label>New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label><label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label></div>{passwordError && <p className="settings-error">{passwordError}</p>}{passwordMessage && <p className="settings-success"><Check size={14} />{passwordMessage}</p>}<button className="admin-save" type="submit" disabled={passwordSaving}>{passwordSaving ? 'Updating...' : 'Update password'}</button></form>
  </>
}

function CustomerView({ title, view }: { title: string; view: string }) { if (view === 'AI Assistant') return <CustomerAssistant />; return <section className="customer-panel customer-empty-view"><div className="customer-view-icon">{view === 'Payments' ? <CreditCard /> : view === 'Receipts' ? <Receipt /> : view === 'Notifications' ? <Bell /> : view === 'Messages' ? <MessageCircle /> : view === 'Settings' ? <Settings /> : <CalendarDays />}</div><h2>{title}</h2><p>This workspace view is connected to your household account. Records and actions will appear here as your company publishes them.</p><button className="panel-link">Contact collection company <ArrowRight size={15} /></button></section> }

function CustomerCollectionsView({ collections }: { collections: Collection[] }) {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const visibleCollections = collections
    .filter((collection) => filter === 'All' || (filter === 'Upcoming' ? ['Scheduled', 'In Progress'].includes(collection.status) : collection.status === filter))
    .filter((collection) => `${collection.address} ${collection.driver} ${collection.vehicle} ${collection.status}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      const aUpcoming = ['Scheduled', 'In Progress'].includes(a.status)
      const bUpcoming = ['Scheduled', 'In Progress'].includes(b.status)
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
      const dateOrder = `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
      return aUpcoming ? dateOrder : -dateOrder
    })
  const upcomingCount = collections.filter((collection) => ['Scheduled', 'In Progress'].includes(collection.status)).length
  const completedCount = collections.filter((collection) => collection.status === 'Completed').length

  return <>
    <section className="customer-collection-summary">
      <article><span><CalendarDays size={17} /></span><small>All visits</small><strong>{collections.length}</strong></article>
      <article><span><Clock3 size={17} /></span><small>Upcoming</small><strong>{upcomingCount}</strong></article>
      <article><span><Check size={17} /></span><small>Completed</small><strong>{completedCount}</strong></article>
    </section>
    <section className="customer-panel customer-collections-panel">
      <div className="customer-panel-heading"><div><h2>Collection schedule</h2><p>Visits assigned to your household</p></div>
        <label className="customer-collection-search"><Search size={15} /><input aria-label="Search collections" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search visits" /></label>
      </div>
      <div className="customer-collection-filters" aria-label="Filter collections">
        {['All', 'Upcoming', 'Completed', 'Missed', 'Cancelled'].map((status) => <button key={status} className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>{status}</button>)}
      </div>
      {visibleCollections.length ? <div className="customer-collection-list">{visibleCollections.map((collection) => {
        const date = new Date(`${collection.date}T12:00:00`)
        const validDate = !Number.isNaN(date.getTime())
        return <article className="customer-collection-row" key={collection.id}>
          <div className="customer-collection-date"><strong>{validDate ? date.toLocaleDateString('en', { day: '2-digit' }) : '--'}</strong><span>{validDate ? date.toLocaleDateString('en', { month: 'short' }) : 'Date'}</span></div>
          <div className="customer-collection-details"><strong>{validDate ? date.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not set'}</strong><span><Clock3 size={13} /> {collection.time}</span><span><MapPin size={13} /> {collection.address}</span></div>
          <div className="customer-collection-assignment"><span><Truck size={13} /> {collection.driver}</span><small>{collection.vehicle}</small></div>
          <span className={`customer-collection-status ${collection.status.toLowerCase().replaceAll(' ', '-')}`}>{collection.status}</span>
        </article>
      })}</div> : <div className="customer-collections-empty"><CalendarDays size={22} /><strong>No visits found</strong><span>{collections.length ? 'Try another filter or search.' : 'Your company has not scheduled a collection yet.'}</span></div>}
    </section>
  </>
}

function CustomerLocationView({ customer }: { customer: Customer | null }) {
  const hasCoordinates = customer?.latitude != null && customer.longitude != null
  const mapQuery = hasCoordinates ? `${customer.latitude},${customer.longitude}` : customer?.location ?? ''
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`

  return <section className="customer-location-layout">
    <article className="customer-panel customer-location-details">
      <div className="customer-location-heading"><span><MapPin size={18} /></span><div><small>REGISTERED SERVICE ADDRESS</small><h2>{customer?.name ?? 'Household location'}</h2></div></div>
      <p>{customer?.location ?? 'No service address is available.'}</p>
      <div className="customer-location-coordinate"><span>Map coordinates</span><strong>{hasCoordinates ? `${customer.latitude?.toFixed(5)}, ${customer.longitude?.toFixed(5)}` : 'Not available'}</strong></div>
      <a className="customer-directions-link" href={mapUrl} target="_blank" rel="noreferrer">{hasCoordinates ? 'Open directions' : 'Search address in Maps'} <ExternalLink size={14} /></a>
      {!hasCoordinates && <p className="customer-location-note">Your saved address is shown here. Map coordinates were not provided during registration.</p>}
    </article>
    <article className="customer-panel customer-location-map-panel">
      <div className="customer-panel-heading"><div><h2>Service point</h2><p>{hasCoordinates ? 'Your registered collection location' : 'Map view unavailable without saved coordinates'}</p></div><MapPin size={18} /></div>
      {hasCoordinates ? <Suspense fallback={<div className="customer-map-unavailable">Loading map...</div>}><CustomerLocationMap position={[customer.latitude!, customer.longitude!]} selected /></Suspense> : <div className="customer-map-unavailable"><MapPin size={24} /><strong>Location pin unavailable</strong><span>Contact your collection company to update your service coordinates.</span></div>}
    </article>
  </section>
}
