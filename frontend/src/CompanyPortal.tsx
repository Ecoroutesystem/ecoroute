import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { BarChart3, Bell, Building2, CalendarDays, Camera, ChevronRight, CreditCard, FileText, KeyRound, LayoutDashboard, LogOut, MapPin, Plus, Receipt, Settings, Truck, Users, Waypoints, X } from 'lucide-react'
import CompanyCustomersView from './CompanyCustomersView'
import CompanyCollectionsView from './CompanyCollectionsView'
import './App.css'

type CompanyPortalProps = { onLogout: () => void }
type Customer = { id: string; name: string; phone?: string; location: string; plan: string; balance: string; status: 'Active' | 'Suspended' | 'Archived' }
type Collection = { id: string; time: string; date: string; address: string; customer: string; driver: string; vehicle: string; status: 'Scheduled' | 'In Progress' | 'Completed' | 'Missed' | 'Cancelled' }
const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Customers', icon: Users },
  { label: 'Collections', icon: CalendarDays },
  { label: 'Routes', icon: Waypoints },
  { label: 'Payments', icon: CreditCard },
  { label: 'Staff', icon: Users },
  { label: 'Vehicles', icon: Truck },
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
  Subscriptions: { title: 'Subscriptions', subtitle: 'Manage service plans and pricing tiers.' },
  Locations: { title: 'Locations', subtitle: 'Manage service zones and coverage areas.' },
  Reports: { title: 'Reports', subtitle: 'Analytics and performance insights.' },
  Notifications: { title: 'Notifications', subtitle: 'Send reminders and updates to customers.' },
  Settings: { title: 'Settings', subtitle: 'Configure your company profile and preferences.' },
}

export default function CompanyPortal({ onLogout }: CompanyPortalProps) {
  const [activeView, setActiveView] = useState('Dashboard')
  const current = viewCopy[activeView]

  return (
    <div className="admin-portal">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="logo-mark"><Building2 size={17} /></span>
          <span><strong>EcoRoute</strong><small>Company workspace</small></span>
        </div>
        <p className="portal-label">Company workspace</p>
        <nav className="admin-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={activeView === label ? 'active' : ''} onClick={() => setActiveView(label)}>
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
            <span><strong>Company User</strong><small>Waste Collection Co.</small></span>
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
              <CompanyDashboard onOpen={setActiveView} />
            </>
          ) : activeView === 'Customers' ? (
            <CompanyCustomersView />
          ) : activeView === 'Collections' ? (
            <CompanyCollectionsView />
          ) : activeView === 'Staff' ? (
            <CompanyStaffView />
          ) : activeView === 'Vehicles' ? (
            <CompanyVehiclesView />
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

function CompanyDashboard({ onOpen }: { onOpen: (view: string) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const [customersResponse, collectionsResponse] = await Promise.all([
          fetch(`${apiBase}/api/customers`),
          fetch(`${apiBase}/api/collections`),
        ])

        const [customersResult, collectionsResult] = await Promise.all([
          customersResponse.json() as Promise<Customer[] | { error?: string }>,
          collectionsResponse.json() as Promise<Collection[] | { error?: string }>,
        ])

        if (!customersResponse.ok) {
          throw new Error('error' in customersResult ? customersResult.error : 'Customer data could not be loaded')
        }
        if (!collectionsResponse.ok) {
          throw new Error('error' in collectionsResult ? collectionsResult.error : 'Collection data could not be loaded')
        }

        setCustomers(customersResult as Customer[])
        setCollections(collectionsResult as Collection[])
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
  const pendingPayments = customers.filter((customer) => customer.balance !== '$0.00').length
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
          <strong>{loading ? '...' : new Set(collections.map((collection) => collection.vehicle).filter((vehicle) => vehicle && vehicle !== 'Unassigned')).size}</strong>
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

function CompanyVehiclesView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: 'V-101', plateNumber: 'CBA-2451', type: 'Truck', capacity: '2.4 tons', status: 'Available' },
    { id: 'V-102', plateNumber: 'LRT-7740', type: 'Compactor', capacity: '3.0 tons', status: 'Occupied' },
    { id: 'V-103', plateNumber: 'JHY-9302', type: 'Van', capacity: '1.2 tons', status: 'Available' },
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [plateNumber, setPlateNumber] = useState('')
  const [type, setType] = useState('Truck')
  const [capacity, setCapacity] = useState('2.0 tons')
  const [status, setStatus] = useState<'Available' | 'Occupied'>('Available')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!plateNumber.trim()) {
      setError('Plate number is required.')
      return
    }

    const vehicle: Vehicle = {
      id: `V-${String(vehicles.length + 101)}`,
      plateNumber: plateNumber.trim(),
      type,
      capacity,
      status,
    }

    setVehicles((current) => [vehicle, ...current])
    setPlateNumber('')
    setType('Truck')
    setCapacity('2.0 tons')
    setStatus('Available')
    setError('')
    setShowAddForm(false)
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
          <strong>{vehicles.length}</strong>
          <span>Fleet count</span>
        </div>
        <div className="company-stat blue">
          <small>Available</small>
          <strong>{vehicles.filter((vehicle) => vehicle.status === 'Available').length}</strong>
          <span>Ready to dispatch</span>
        </div>
        <div className="company-stat yellow">
          <small>Occupied</small>
          <strong>{vehicles.filter((vehicle) => vehicle.status === 'Occupied').length}</strong>
          <span>In service</span>
        </div>
        <div className="company-stat coral">
          <small>Capacity mix</small>
          <strong>{new Set(vehicles.map((vehicle) => vehicle.type)).size}</strong>
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

        {vehicles.length === 0 ? (
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

type StaffMember = { id: string; name: string; phone: string; position: string; hireDate: string; status: 'Active' | 'On Leave' | 'Inactive' }

function CompanyStaffView() {
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: 'S-101', name: 'Amina Hassan', phone: '+254 721 440 290', position: 'Operations Manager', hireDate: '2024-02-14', status: 'Active' },
    { id: 'S-102', name: 'David Otieno', phone: '+254 712 998 211', position: 'Driver', hireDate: '2023-11-05', status: 'On Leave' },
    { id: 'S-103', name: 'Grace Njeri', phone: '+254 734 220 304', position: 'Collections Supervisor', hireDate: '2024-01-22', status: 'Active' },
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('Driver')
  const [hireDate, setHireDate] = useState('')
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim() || !phone.trim() || !position.trim() || !hireDate) {
      setError('Please complete all staff fields.')
      return
    }

    const member: StaffMember = {
      id: `S-${String(staff.length + 101)}`,
      name: name.trim(),
      phone: phone.trim(),
      position: position.trim(),
      hireDate,
      status,
    }

    setStaff((current) => [member, ...current])
    setName('')
    setPhone('')
    setPosition('Driver')
    setHireDate('')
    setStatus('Active')
    setError('')
    setShowAddForm(false)
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="section-kicker"><span className="kicker-line" /> TEAM MANAGEMENT</p>
          <h1>Staff</h1>
          <p>Keep your team details organized and monitor current staffing status.</p>
        </div>
        <button className="admin-action" onClick={() => setShowAddForm(true)}><Plus size={14} /> Add staff</button>
      </div>

      {error && <p className="settings-error company-error">{error}</p>}

      <section className="company-stats">
        <div className="company-stat green">
          <small>Total staff</small>
          <strong>{staff.length}</strong>
          <span>Team size</span>
        </div>
        <div className="company-stat blue">
          <small>Active</small>
          <strong>{staff.filter((member) => member.status === 'Active').length}</strong>
          <span>Available</span>
        </div>
        <div className="company-stat yellow">
          <small>On leave</small>
          <strong>{staff.filter((member) => member.status === 'On Leave').length}</strong>
          <span>Temporary off</span>
        </div>
        <div className="company-stat coral">
          <small>Inactive</small>
          <strong>{staff.filter((member) => member.status === 'Inactive').length}</strong>
          <span>Not active</span>
        </div>
      </section>

      <section className="admin-panel company-list">
        <div className="admin-panel-heading">
          <div>
            <h2>Staff roster</h2>
            <p>Contact details, job role, hire date and employment status.</p>
          </div>
        </div>

        {staff.length === 0 ? (
          <p className="company-loading">No staff added yet.</p>
        ) : (
          staff.map((member) => (
            <div className="staff-row" key={member.id}>
              <div className="staff-badge">
                {member.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="staff-main">
                <strong>{member.name}</strong>
                <small>{member.position} · {member.phone}</small>
              </div>
              <div className="staff-meta"><span>{member.hireDate}</span></div>
              <span className={`staff-status ${member.status === 'Active' ? 'active' : member.status === 'On Leave' ? 'leave' : 'inactive'}`}>{member.status}</span>
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
                <h2>Add staff</h2>
              </div>
              <button className="company-modal-close" onClick={() => setShowAddForm(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="company-form">
              <label>
                Full name
                <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Jane Doe" />
              </label>

              <label>
                Phone number
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="e.g. +254 712 000 111" />
              </label>

              <label>
                Position
                <input type="text" value={position} onChange={(event) => setPosition(event.target.value)} placeholder="e.g. Driver" />
              </label>

              <label>
                Hire date
                <input type="date" value={hireDate} onChange={(event) => setHireDate(event.target.value)} />
              </label>

              <label>
                Status
                <select value={status} onChange={(event) => setStatus(event.target.value as 'Active' | 'On Leave' | 'Inactive')}>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

              <div className="company-form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="admin-save">Save staff</button>
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
