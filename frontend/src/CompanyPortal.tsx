import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { BarChart3, Bell, Building2, CalendarDays, Camera, ChevronRight, CreditCard, FileText, KeyRound, LayoutDashboard, LogOut, MapPin, Menu, Pencil, Plus, Receipt, Settings, Truck, Users, Waypoints, X } from 'lucide-react'
import CompanyCustomersView from './CompanyCustomersView'
import CompanyCollectionsView from './CompanyCollectionsView'
import CompanyPricingView from './CompanyPricingView'
import { CompanyPaymentsView } from './PaymentViews'
import CompanyRoutesView from './CompanyRoutesView'
import { companyFetch } from './companyApi'
import './App.css'

type CompanyPortalProps = { companyId: string; userName: string; userRole: string; onLogout: () => void }
type Customer = { id: string; name: string; phone?: string; location: string; plan: string; balance: string; status: 'Active' | 'Suspended' | 'Archived' }
type Collection = { id: string; time: string; date: string; address: string; customer: string; driver: string; vehicle: string; status: 'Scheduled' | 'In Progress' | 'Completed' | 'Missed' | 'Cancelled' }
const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Customers', icon: Users },
  { label: 'Collections', icon: CalendarDays },
  { label: 'Routes', icon: Waypoints },
  { label: 'Payments', icon: CreditCard },
  { label: 'Staff', icon: Users },
  { label: 'Vehicles', icon: Truck },
  { label: 'Users & vehicles', icon: Users },
  { label: 'Subscriptions', icon: Receipt },
  { label: 'Locations', icon: MapPin },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Notifications', icon: Bell },
  { label: 'Settings', icon: Settings },
]

const viewCopy: Record<string, { title: string; subtitle: string }> = {
  Dashboard: { title: 'Company Dashboard', subtitle: 'Overview of your waste collection operations.' },
  Customers: { title: 'Customers', subtitle: 'Manage your household customers and their service plans.' },
  Collections: { title: 'Collections', subtitle: 'Schedule and track waste collection visits.' },
  Routes: { title: 'Routes', subtitle: 'Optimize and manage collection routes.' },
  Payments: { title: 'Payments', subtitle: 'Track customer payments and outstanding balances.' },
  Staff: { title: 'Staff', subtitle: 'Manage your drivers and collection team.' },
  Vehicles: { title: 'Vehicles', subtitle: 'Track and maintain your fleet vehicles.' },
  'Users & vehicles': { title: 'Users & vehicles', subtitle: 'Coordinate your field users and the vehicles they operate.' },
  Subscriptions: { title: 'Subscriptions', subtitle: 'Manage service plans and pricing tiers.' },
  Locations: { title: 'Locations', subtitle: 'Manage service zones and coverage areas.' },
  Reports: { title: 'Reports', subtitle: 'Analytics and performance insights.' },
  Notifications: { title: 'Notifications', subtitle: 'Send reminders and updates to customers.' },
  Settings: { title: 'Settings', subtitle: 'Configure your company profile and preferences.' },
}

export default function CompanyPortal({ companyId, userName, userRole, onLogout }: CompanyPortalProps) {
  const [activeView, setActiveView] = useState('Dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const roleViews: Record<string, string[]> = {
    'Operations Dispatcher': ['Dashboard', 'Collections', 'Routes', 'Customers'],
    Supervisor: ['Dashboard', 'Collections', 'Routes', 'Customers', 'Staff', 'Reports'],
    Driver: ['Dashboard', 'Collections', 'Routes'],
    'Collection Team': ['Dashboard', 'Collections'],
    'Finance / Billing Officer': ['Dashboard', 'Customers', 'Payments', 'Subscriptions', 'Reports'],
    'Customer Service Officer': ['Dashboard', 'Customers', 'Notifications'],
    'Fleet Officer': ['Dashboard', 'Vehicles', 'Users & vehicles'],
    Secretary: ['Dashboard', 'Customers', 'Collections', 'Notifications'],
    Worker: ['Dashboard', 'Collections', 'Routes'],
    Accountant: ['Dashboard', 'Payments', 'Subscriptions', 'Reports'],
    HR: ['Dashboard', 'Staff'],
  }
  const allowedViews = roleViews[userRole]
  const companyNavigation = allowedViews ? navigation.filter(({ label }) => allowedViews.includes(label)) : navigation
  const current = viewCopy[activeView]

  return (
    <div className="admin-portal" data-company-id={companyId}>
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-brand">
          <span className="logo-mark"><Building2 size={17} /></span>
          <span><strong>EcoRoute</strong><small>Company workspace</small></span>
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenuOpen}><span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>{mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
        <p className="portal-label">Company workspace</p>
        <nav className="admin-nav">
          {companyNavigation.map(({ label, icon: Icon }) => (
            <button key={label} className={activeView === label ? 'active' : ''} onClick={() => { setActiveView(label); setMobileMenuOpen(false) }}>
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={onLogout}><LogOut size={17} /> Logout</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><span className="portal-breadcrumb">Company /</span> {activeView}</div>
          <div className="admin-user">
            <span className="admin-avatar">CO</span>
            <span><strong>{userName}</strong><small>{userRole}</small></span>
          </div>
        </header>

        <div className="admin-content">
          {activeView === 'Dashboard' ? (
            <>
              <div className="admin-heading">
                <div>
                  <p className="section-kicker"><span className="kicker-line" /> COMPANY WORKSPACE</p>
                  <h1>{current.title}</h1>
                  <p>{current.subtitle}</p>
                </div>
                <span className="admin-status"><i /> Connected</span>
              </div>
              <CompanyDashboard companyId={companyId} onOpen={setActiveView} />
            </>
          ) : activeView === 'Customers' ? (
            <CompanyCustomersView companyId={companyId} />
          ) : activeView === 'Collections' ? (
            <CompanyCollectionsView />
          ) : activeView === 'Routes' ? (
            <CompanyRoutesView />
          ) : activeView === 'Payments' ? (
            <CompanyPaymentsView companyId={companyId} />
          ) : activeView === 'Staff' ? (
            <CompanyStaffView companyId={companyId} />
          ) : activeView === 'Subscriptions' ? (
            <CompanyPricingView companyId={companyId} />
          ) : activeView === 'Vehicles' ? (
            <CompanyVehiclesView />
          ) : activeView === 'Users & vehicles' ? (
            <CompanyUsersVehiclesView companyId={companyId} />
          ) : activeView === 'Settings' ? (
            <CompanySettingsView />
          ) : (
            <>
              <div className="admin-heading">
                <div>
                  <p className="section-kicker"><span className="kicker-line" /> COMPANY WORKSPACE</p>
                  <h1>{current.title}</h1>
                  <p>{current.subtitle}</p>
                </div>
                <span className="admin-status"><i /> Connected</span>
              </div>
              <CompanyView title={current.title} view={activeView} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function CompanyDashboard({ companyId, onOpen }: { companyId: string; onOpen: (view: string) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const [customersResponse, collectionsResponse, vehiclesResponse] = await Promise.all([
          companyFetch(`/api/customers?companyId=${encodeURIComponent(companyId)}`),
          companyFetch('/api/company/collections'),
          companyFetch('/api/company/vehicles'),
        ])

        const [customersResult, collectionsResult, vehiclesResult] = await Promise.all([
          customersResponse.json() as Promise<Customer[] | { error?: string }>,
          collectionsResponse.json() as Promise<Collection[] | { error?: string }>,
          vehiclesResponse.json() as Promise<Vehicle[] | { error?: string }>,
        ])

        if (!customersResponse.ok) {
          throw new Error('error' in customersResult ? customersResult.error : 'Customer data could not be loaded')
        }
        if (!collectionsResponse.ok) {
          throw new Error('error' in collectionsResult ? collectionsResult.error : 'Collection data could not be loaded')
        }
        if (!vehiclesResponse.ok) {
          throw new Error('error' in vehiclesResult ? vehiclesResult.error : 'Vehicle data could not be loaded')
        }

        setCustomers(customersResult as Customer[])
        setCollections(collectionsResult as Collection[])
        setVehicles(vehiclesResult as Vehicle[])
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Dashboard data could not be loaded')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const totalCustomers = customers.length
  const activeCustomers = customers.filter((customer) => customer.status === 'Active').length
  const scheduledCollections = collections.filter((collection) => collection.status === 'Scheduled').length
  const inProgressCollections = collections.filter((collection) => collection.status === 'In Progress').length
  const pendingPayments = customers.filter((customer) => parseFloat(customer.balance.replace(/[^0-9.]/g, '') || '0') > 0).length
  const upcomingCollections = [...collections]
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3)

  return (
    <>
      <section className="admin-metrics">
        <div className="admin-metric green">
          <span><Users size={18} /></span>
          <small>Total customers</small>
          <strong>{loading ? '...' : totalCustomers}</strong>
          <em>{activeCustomers} active</em>
        </div>
        <div className="admin-metric blue">
          <span><CalendarDays size={18} /></span>
          <small>Collections today</small>
          <strong>{loading ? '...' : scheduledCollections + inProgressCollections}</strong>
          <em>Scheduled visits</em>
        </div>
        <div className="admin-metric yellow">
          <span><CreditCard size={18} /></span>
          <small>Pending payments</small>
          <strong>{loading ? '...' : pendingPayments}</strong>
          <em>Outstanding balance</em>
        </div>
        <div className="admin-metric coral">
          <span><Truck size={18} /></span>
          <small>Active vehicles</small>
          <strong>{loading ? '...' : vehicles.filter((vehicle) => vehicle.status === 'Available').length}</strong>
          <em>Fleet status</em>
        </div>
      </section>

      {error && <p className="settings-error company-error">{error}</p>}

      <section className="admin-grid">
        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Today's collections</h2>
              <p>Upcoming waste collection visits</p>
            </div>
            <button onClick={() => onOpen('Collections')}>View all <ChevronRight size={14} /></button>
          </div>

          {loading ? (
            <p className="company-loading">Loading collections...</p>
          ) : upcomingCollections.length === 0 ? (
            <p className="company-loading">No collections scheduled yet.</p>
          ) : (
            upcomingCollections.map((collection) => (
              <div className="collection-row" key={collection.id}>
                <span className="collection-time">{collection.time}</span>
                <div>
                  <strong>{collection.customer}</strong>
                  <small>{collection.address}</small>
                </div>
                <span className={`status-pill ${collection.status === 'Scheduled' ? 'scheduled' : collection.status === 'In Progress' ? 'in-progress' : collection.status === 'Completed' ? 'completed' : collection.status === 'Missed' ? 'missed' : 'cancelled'}`}>
                  {collection.status}
                </span>
              </div>
            ))
          )}
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Service overview</h2>
              <p>Customer activity and route visibility</p>
            </div>
          </div>

          <div className="mini-stat-grid">
            <div className="mini-stat">
              <small>Active users</small>
              <strong>{loading ? '...' : activeCustomers}</strong>
            </div>
            <div className="mini-stat">
              <small>Scheduled</small>
              <strong>{loading ? '...' : scheduledCollections}</strong>
            </div>
            <div className="mini-stat">
              <small>In progress</small>
              <strong>{loading ? '...' : inProgressCollections}</strong>
            </div>
            <div className="mini-stat">
              <small>Pending</small>
              <strong>{loading ? '...' : pendingPayments}</strong>
            </div>
          </div>
        </article>
      </section>
    </>
  )
}

function CompanyView({ title, view }: { title: string; view: string }) {
  const icon = view === 'Customers' ? <Users /> : view === 'Collections' ? <CalendarDays /> : view === 'Routes' ? <Waypoints /> : view === 'Payments' ? <CreditCard /> : view === 'Staff' ? <Users /> : view === 'Vehicles' ? <Truck /> : view === 'Subscriptions' ? <Receipt /> : view === 'Locations' ? <MapPin /> : view === 'Reports' ? <BarChart3 /> : view === 'Notifications' ? <Bell /> : <Settings />

  return (
    <section className="admin-empty">
      <div className="admin-empty-icon">{icon}</div>
      <h1>{title}</h1>
      <p>This company workspace is ready for live records and controls.</p>
      <button className="admin-action">Open module <ChevronRight size={15} /></button>
    </section>
  )
}

type Vehicle = { id: string; plateNumber: string; type: string; capacity: string; status: 'Available' | 'Occupied' }

function CompanyUsersVehiclesView({ companyId }: { companyId: string }) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void Promise.all([
      companyFetch(`/api/companies/${encodeURIComponent(companyId)}/employees`),
      companyFetch('/api/company/vehicles'),
    ]).then(async ([staffResponse, vehicleResponse]) => {
      const [staffData, vehicleData] = await Promise.all([staffResponse.json(), vehicleResponse.json()])
      if (!staffResponse.ok) throw new Error(staffData.error ?? 'Company staff could not be loaded.')
      if (!vehicleResponse.ok) throw new Error(vehicleData.error ?? 'Company vehicles could not be loaded.')
      if (active) {
        setStaff(staffData as StaffMember[])
        setVehicles(vehicleData as Vehicle[])
      }
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Company operations could not be loaded.')
    })
    return () => { active = false }
  }, [companyId])

  return <><div className="admin-heading"><div><p className="section-kicker"><span className="kicker-line" /> OPERATIONS MANAGEMENT</p><h1>Users &amp; vehicles</h1><p>See your company’s team and fleet records together.</p></div><span className="admin-status"><i /> Connected</span></div>{error && <p className="settings-error company-error">{error}</p>}<section className="admin-grid"><article className="admin-panel"><div className="admin-panel-heading"><div><h2>Company users</h2><p>{staff.length} staff accounts</p></div><button onClick={() => window.alert('Manage accounts from the Staff module.')}>Manage users <ChevronRight size={14} /></button></div>{staff.length ? staff.map((user) => <div className="staff-row" key={user.id}><div className="staff-badge">{user.name.split(' ').map((part) => part[0]).join('')}</div><div className="staff-main"><strong>{user.name}</strong><small>{user.role} · {user.department}</small></div><span className={`staff-status ${user.status === 'Active' ? 'active' : 'leave'}`}>{user.status}</span></div>) : <p className="company-loading">No staff accounts found.</p>}</article><article className="admin-panel"><div className="admin-panel-heading"><div><h2>Fleet availability</h2><p>Vehicles registered to this company.</p></div><button onClick={() => window.alert('Manage vehicles from the Vehicles module.')}>Manage fleet <ChevronRight size={14} /></button></div>{vehicles.length ? vehicles.map((vehicle) => <div className="vehicle-row" key={vehicle.id}><div className="vehicle-badge"><Truck size={16} /></div><div className="vehicle-main"><strong>{vehicle.plateNumber}</strong><small>{vehicle.type} · {vehicle.capacity}</small></div><span className={`vehicle-status ${vehicle.status === 'Available' ? 'available' : 'occupied'}`}>{vehicle.status}</span></div>) : <p className="company-loading">No vehicles registered yet.</p>}</article></section></>
}

function CompanyVehiclesView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [plateNumber, setPlateNumber] = useState('')
  const [type, setType] = useState('Truck')
  const [capacity, setCapacity] = useState('2.0 tons')
  const [status, setStatus] = useState<'Available' | 'Occupied'>('Available')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadVehicles = async () => {
    setError('')
    try {
      const response = await companyFetch('/api/company/vehicles')
      const result = await response.json() as Vehicle[] | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Vehicles could not be loaded.')
      setVehicles(result as Vehicle[])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Vehicles could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadVehicles() }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      const response = await companyFetch('/api/company/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plateNumber, type, capacity, status }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Vehicle could not be saved.')
      setPlateNumber('')
      setType('Truck')
      setCapacity('2.0 tons')
      setStatus('Available')
      setShowAddForm(false)
      await loadVehicles()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Vehicle could not be saved.')
    }
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="section-kicker"><span className="kicker-line" /> FLEET MANAGEMENT</p>
          <h1>Vehicles</h1>
          <p>Track the trucks and service vehicles assigned to your operations.</p>
        </div>
        <button className="admin-action" onClick={() => setShowAddForm(true)}><Plus size={14} /> Add vehicle</button>
      </div>

      {error && <p className="settings-error company-error">{error}</p>}

      <section className="company-stats">
        <div className="company-stat green">
          <small>Total vehicles</small>
          <strong>{loading ? '...' : vehicles.length}</strong>
          <span>Fleet count</span>
        </div>
        <div className="company-stat blue">
          <small>Available</small>
          <strong>{loading ? '...' : vehicles.filter((vehicle) => vehicle.status === 'Available').length}</strong>
          <span>Ready to dispatch</span>
        </div>
        <div className="company-stat yellow">
          <small>Occupied</small>
          <strong>{loading ? '...' : vehicles.filter((vehicle) => vehicle.status === 'Occupied').length}</strong>
          <span>In service</span>
        </div>
        <div className="company-stat coral">
          <small>Capacity mix</small>
          <strong>{loading ? '...' : new Set(vehicles.map((vehicle) => vehicle.type)).size}</strong>
          <span>Vehicle types</span>
        </div>
      </section>

      <section className="admin-panel company-list">
        <div className="admin-panel-heading">
          <div>
            <h2>Fleet overview</h2>
            <p>Monitor plates, service type, capacity and availability.</p>
          </div>
        </div>

        {loading ? <p className="company-loading">Loading company vehicles...</p> : vehicles.length === 0 ? (
          <p className="company-loading">No vehicles added yet.</p>
        ) : (
          vehicles.map((vehicle) => (
            <div className="vehicle-row" key={vehicle.id}>
              <div className="vehicle-badge"><Truck size={16} /></div>
              <div className="vehicle-main">
                <strong>{vehicle.plateNumber}</strong>
                <small>{vehicle.type} · {vehicle.capacity}</small>
              </div>
              <span className={`vehicle-status ${vehicle.status === 'Available' ? 'available' : 'occupied'}`}>{vehicle.status}</span>
            </div>
          ))
        )}
      </section>

      {showAddForm && (
        <div className="company-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAddForm(false) }}>
          <section className="company-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="company-modal-header">
              <div>
                <p className="section-kicker"><span className="kicker-line" /> FLEET</p>
                <h2>Add vehicle</h2>
              </div>
              <button className="company-modal-close" onClick={() => setShowAddForm(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="company-form">
              <label>
                Plate number
                <input type="text" value={plateNumber} onChange={(event) => setPlateNumber(event.target.value)} placeholder="e.g. KBA 212A" />
              </label>

              <label>
                Vehicle type
                <select value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="Truck">Truck</option>
                  <option value="Compactor">Compactor</option>
                  <option value="Van">Van</option>
                  <option value="Tanker">Tanker</option>
                </select>
              </label>

              <label>
                Capacity
                <input type="text" value={capacity} onChange={(event) => setCapacity(event.target.value)} placeholder="e.g. 2.0 tons" />
              </label>

              <label>
                Status
                <select value={status} onChange={(event) => setStatus(event.target.value as 'Available' | 'Occupied')}>
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                </select>
              </label>

              <div className="company-form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="admin-save">Save vehicle</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}

type StaffMember = { id: string; employeeId: string; name: string; phone: string; email: string; department: string; role: string; status: 'Active' | 'Inactive' | 'Suspended'; createdAt: string; lastLogin: string | null }
type StaffForm = { name: string; phone: string; email: string; employeeId: string; department: string; role: string; status: StaffMember['status']; password: string }
const employeeRoles = ['Company Owner / Director', 'Manager', 'Company Admin', 'Operations Dispatcher', 'Supervisor', 'Driver', 'Collection Team', 'Finance / Billing Officer', 'Customer Service Officer', 'Fleet Officer', 'Secretary', 'Worker', 'Accountant', 'HR']
const emptyStaffForm: StaffForm = { name: '', phone: '', email: '', employeeId: '', department: '', role: 'Driver', status: 'Active', password: '' }

function CompanyStaffView({ companyId }: { companyId: string }) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [form, setForm] = useState<StaffForm>(emptyStaffForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadStaff = async () => {
    if (!companyId) { setError('This company login is not linked to a company record.'); setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const response = await companyFetch(`/api/companies/${encodeURIComponent(companyId)}/employees`)
      const result = await response.json() as StaffMember[] | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Employee records could not be loaded.')
      setStaff(result as StaffMember[])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Employee records could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    if (!companyId) {
      setError('This company login is not linked to a company record.')
      setLoading(false)
      return () => { active = false }
    }
    void companyFetch(`/api/companies/${encodeURIComponent(companyId)}/employees`)
      .then(async (response) => {
        const result = await response.json() as StaffMember[] | { error?: string }
        if (!response.ok) throw new Error('error' in result ? result.error : 'Employee records could not be loaded.')
        if (active) setStaff(result as StaffMember[])
      })
      .catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Employee records could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [companyId])

  const openCreateForm = () => { setEditingStaff(null); setForm(emptyStaffForm); setError(''); setShowAddForm(true) }
  const openEditForm = (member: StaffMember) => {
    setEditingStaff(member)
    setForm({ name: member.name, phone: member.phone, email: member.email, employeeId: member.employeeId, department: member.department, role: member.role, status: member.status, password: '' })
    setError('')
    setShowAddForm(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!companyId) return setError('This company login is not linked to a company record.')
    if (!editingStaff && form.password.length < 8) return setError('Set an initial password with at least 8 characters.')
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const response = await companyFetch(`/api/companies/${encodeURIComponent(companyId)}/employees${editingStaff ? `/${editingStaff.id}` : ''}`, {
        method: editingStaff ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, employeeId: form.employeeId.trim() }),
      })
      const result = await response.json() as StaffMember | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Employee could not be saved.')
      setNotice(editingStaff ? 'Employee details updated.' : 'Employee account created. Share the initial password securely.')
      setShowAddForm(false)
      await loadStaff()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Employee could not be saved.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (member: StaffMember, status: StaffMember['status']) => {
    try {
      const response = await companyFetch(`/api/companies/${encodeURIComponent(companyId)}/employees/${member.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...member, status }),
      })
      const result = await response.json() as StaffMember | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Employee status could not be updated.')
      setStaff((current) => current.map((item) => item.id === member.id ? result as StaffMember : item))
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Employee status could not be updated.')
    }
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="section-kicker"><span className="kicker-line" /> TEAM MANAGEMENT</p>
          <h1>Employees</h1>
          <p>Create company accounts and assign a role to each employee.</p>
        </div>
        <button className="admin-action" onClick={openCreateForm}><Plus size={14} /> Add employee</button>
      </div>

      {error && <p className="settings-error company-error">{error}</p>}
      {notice && <p className="payment-notice">{notice}</p>}

      <section className="company-stats">
        <div className="company-stat green">
          <small>Total staff</small>
          <strong>{loading ? '...' : staff.length}</strong>
          <span>Company accounts</span>
        </div>
        <div className="company-stat blue">
          <small>Active</small>
          <strong>{loading ? '...' : staff.filter((member) => member.status === 'Active').length}</strong>
          <span>Access enabled</span>
        </div>
        <div className="company-stat yellow">
          <small>Inactive</small>
          <strong>{loading ? '...' : staff.filter((member) => member.status === 'Inactive').length}</strong>
          <span>Access disabled</span>
        </div>
        <div className="company-stat coral">
          <small>Inactive</small>
          <strong>{loading ? '...' : staff.filter((member) => member.status === 'Suspended').length}</strong>
          <span>Suspended accounts</span>
        </div>
      </section>

      <section className="admin-panel company-list">
        <div className="admin-panel-heading">
          <div>
            <h2>Staff roster</h2>
            <p>Contact, assigned role, access status and account activity.</p>
          </div>
          <button onClick={() => void loadStaff()}><ChevronRight size={14} /> Refresh</button>
        </div>

        {loading ? (
          <p className="company-loading">Loading employees...</p>
        ) : staff.length === 0 ? (
          <p className="company-loading">No employees added yet.</p>
        ) : (
          staff.map((member) => (
            <div className="staff-row" key={member.id}>
              <div className="staff-badge">
                {member.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="staff-main">
                <strong>{member.name}</strong>
                <small>{member.role} · {member.department} · {member.phone}</small>
              </div>
              <div className="staff-meta"><span>{member.employeeId} · {member.email}</span><small>Last login: {member.lastLogin ? new Date(member.lastLogin).toLocaleString() : 'Never'}</small></div>
              <span className={`staff-status ${member.status === 'Active' ? 'active' : member.status === 'Suspended' ? 'leave' : 'inactive'}`}>{member.status}</span>
              <div className="company-actions"><button className="view-action" onClick={() => openEditForm(member)}><Pencil size={13} /> Edit</button>{member.status !== 'Active' && <button className="approve-action" onClick={() => void updateStatus(member, 'Active')}>Activate</button>}{member.status !== 'Inactive' && <button className="cancel-action" onClick={() => void updateStatus(member, 'Inactive')}>Deactivate</button>}{member.status !== 'Suspended' && <button className="delete-action" onClick={() => void updateStatus(member, 'Suspended')}>Suspend</button>}</div>
            </div>
          ))
        )}
      </section>

      {showAddForm && (
        <div className="company-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAddForm(false) }}>
          <section className="company-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="company-modal-header">
              <div>
                <p className="section-kicker"><span className="kicker-line" /> TEAM</p>
                <h2>{editingStaff ? 'Edit employee' : 'Add employee'}</h2>
              </div>
              <button className="company-modal-close" onClick={() => setShowAddForm(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="company-form">
              <label>
                Full name
                <input required type="text" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Jane Doe" />
              </label>

              <label>
                Phone number
                <input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="e.g. +250 788 000 111" />
              </label>

              <label>
                Email address
                <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="employee@company.rw" />
              </label>

              <label>
                Employee ID
                <input required type="text" value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} placeholder="e.g. EMP-001" />
              </label>

              <label>
                Department
                <input required type="text" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="e.g. Operations" />
              </label>

              <label>
                Employee role
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                  {employeeRoles.map((role) => <option key={role}>{role}</option>)}
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StaffMember['status'] })}>
                  <option>Active</option><option>Inactive</option><option>Suspended</option>
                </select>
              </label>

              {!editingStaff && <label>Initial password<input required type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label>}

              <div className="company-form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="admin-save" disabled={submitting}>{submitting ? 'Saving...' : editingStaff ? 'Save changes' : 'Create employee'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}

function CompanySettingsView() {
  const [photo, setPhoto] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [details, setDetails] = useState({
    name: 'Waste Collection Co.',
    email: 'hello@wastecollection.co',
    phone: '+1 (415) 555-0145',
    address: '128 Greenway Avenue, Suite 200',
    website: 'https://www.wastecollection.co',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file for your company logo.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPhoto(previewUrl)
    setMessage('Company profile picture updated.')
    setError('')
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      setMessage('')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setMessage('')
      return
    }

    setError('')
    setMessage('Password updated successfully.')
    setPassword('')
    setConfirmPassword('')
  }

  const handleDetailsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('Company details saved successfully.')
  }

  return (
    <section className="settings-grid">
      <div className="admin-panel">
        <div className="settings-title">
          <span className="settings-icon"><Camera size={16} /></span>
          <div>
            <h2>Profile picture</h2>
            <p>Update the logo shown across the company workspace.</p>
          </div>
        </div>

        <div className="profile-editor">
          <div className="profile-preview">{photo ? <img src={photo} alt="Company profile" /> : details.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <label className="upload-button">
              <Camera size={13} /> Upload photo
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>
            <small>PNG, JPG or WEBP up to 2MB</small>
          </div>
        </div>
      </div>

      <div className="admin-panel password-settings">
        <div className="settings-title">
          <span className="settings-icon"><KeyRound size={16} /></span>
          <div>
            <h2>Password</h2>
            <p>Update your sign-in credentials for secure access.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit}>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter new password" />
          </label>
          <label>
            Confirm password
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" />
          </label>
          <button type="submit" className="admin-save">Update password</button>
        </form>
      </div>

      <div className="admin-panel">
        <div className="settings-title">
          <span className="settings-icon"><FileText size={16} /></span>
          <div>
            <h2>Company details</h2>
            <p>Keep your business information accurate for customers and operations.</p>
          </div>
        </div>

        <form onSubmit={handleDetailsSubmit} className="password-settings">
          <label>
            Company name
            <input type="text" value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} />
          </label>
          <label>
            Contact email
            <input type="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} />
          </label>
          <label>
            Phone number
            <input type="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} />
          </label>
          <label>
            Address
            <input type="text" value={details.address} onChange={(event) => setDetails({ ...details, address: event.target.value })} />
          </label>
          <label>
            Website
            <input type="url" value={details.website} onChange={(event) => setDetails({ ...details, website: event.target.value })} />
          </label>
          <button type="submit" className="admin-save">Save company details</button>
        </form>
      </div>

      {(error || message) && (
        <div className="settings-feedback">
          {error && <p className="settings-error">{error}</p>}
          {message && <p className="settings-success">{message}</p>}
        </div>
      )}
    </section>
  )
}
