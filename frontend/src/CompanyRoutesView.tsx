import { useEffect, useState, type FormEvent } from 'react'
import { CalendarDays, Check, ChevronDown, Clock3, MapPin, Plus, Route, Trash2, Truck, Users, X } from 'lucide-react'
import { companyFetch } from './companyApi'
import './App.css'

type RouteStatus = 'Planned' | 'In Progress' | 'Completed'
type Stop = { id: string; customer: string; address: string; date: string; time: string; status: string }
type Staff = { id: string; name: string; position: string }
type Vehicle = { id: string; plateNumber: string; type: string }
type CompanyRoute = {
  id: string
  name: string
  date: string
  area: string
  status: RouteStatus
  staffId?: string | null
  staffName?: string | null
  vehicleId?: string | null
  vehicle?: string | null
  stops: Stop[]
}
type RouteData = { routes: CompanyRoute[]; unassignedCollections: Stop[]; staff: Staff[]; vehicles: Vehicle[] }

const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export default function CompanyRoutesView() {
  const [data, setData] = useState<RouteData>({ routes: [], unassignedCollections: [], staff: [], vehicles: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)

  const loadRoutes = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await companyFetch('/api/company/routes')
      const result = await response.json() as RouteData | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Routes could not be loaded.')
      setData(result as RouteData)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Routes could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadRoutes() }, [])

  const updateStatus = async (route: CompanyRoute, status: RouteStatus) => {
    setError('')
    try {
      const response = await companyFetch(`/api/company/routes/${route.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await response.json() as { id?: string; status?: RouteStatus; error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Route status could not be updated.')
      setData((current) => ({
        ...current,
        routes: current.routes.map((item) => item.id === route.id ? { ...item, status: result.status ?? status } : item),
      }))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Route status could not be updated.')
    }
  }

  const deleteRoute = async (route: CompanyRoute) => {
    if (!window.confirm(`Delete route "${route.name}"? Its collections will be available to assign again.`)) return
    setError('')
    try {
      const response = await companyFetch(`/api/company/routes/${route.id}`, { method: 'DELETE' })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Route could not be deleted.')
      await loadRoutes()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Route could not be deleted.')
    }
  }

  const activeRoutes = data.routes.filter((route) => route.status === 'In Progress').length
  const plannedRoutes = data.routes.filter((route) => route.status === 'Planned').length
  const completedStops = data.routes.reduce((total, route) => total + route.stops.filter((stop) => stop.status === 'Completed').length, 0)

  return <>
    <div className="admin-heading">
      <div><p className="section-kicker"><span className="kicker-line" /> ROUTE OPERATIONS</p><h1>Routes</h1><p>Build dispatch-ready routes from your company’s scheduled collection stops.</p></div>
      <button className="admin-action" onClick={() => setShowForm(true)}><Plus size={14} /> Plan a route</button>
    </div>
    {error && <p className="settings-error company-error" role="alert">{error}</p>}
    <section className="company-stats">
      <div className="company-stat green"><small>Total routes</small><strong>{loading ? '...' : data.routes.length}</strong><span>Your planned operations</span></div>
      <div className="company-stat blue"><small>In progress</small><strong>{loading ? '...' : activeRoutes}</strong><span>Currently dispatched</span></div>
      <div className="company-stat yellow"><small>Planned</small><strong>{loading ? '...' : plannedRoutes}</strong><span>Ready for dispatch</span></div>
      <div className="company-stat coral"><small>Completed stops</small><strong>{loading ? '...' : completedStops}</strong><span>Across your routes</span></div>
    </section>

    <section className="admin-panel company-list company-routes-list">
      <div className="admin-panel-heading">
        <div><h2>Route schedule</h2><p>{data.unassignedCollections.length} collection{data.unassignedCollections.length === 1 ? '' : 's'} awaiting assignment</p></div>
        <button onClick={() => void loadRoutes()}>Refresh <ChevronDown size={14} /></button>
      </div>
      {loading ? <p className="company-loading">Loading your routes...</p> : data.routes.length === 0 ? (
        <div className="company-routes-empty"><span><Route size={22} /></span><h3>No routes planned yet</h3><p>Create a route and assign one or more of your scheduled collections to it.</p><button className="admin-action" onClick={() => setShowForm(true)}><Plus size={14} /> Plan your first route</button></div>
      ) : data.routes.map((route) => (
        <article className="company-route-card" key={route.id}>
          <div className="company-route-main">
            <div className="company-route-icon"><Route size={18} /></div>
            <div className="company-route-title"><h3>{route.name}</h3><p><MapPin size={13} /> {route.area} <span>·</span> <CalendarDays size={13} /> {formatDate(route.date)}</p></div>
            <span className={`company-route-status ${route.status.toLowerCase().replaceAll(' ', '-')}`}>{route.status}</span>
          </div>
          <div className="company-route-meta">
            <span><Users size={14} /> {route.staffName ?? 'No driver assigned'}</span>
            <span><Truck size={14} /> {route.vehicle ?? 'No vehicle assigned'}</span>
            <button className="company-route-stops-toggle" onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)} aria-expanded={expandedRoute === route.id}>
              {route.stops.length} stop{route.stops.length === 1 ? '' : 's'} <ChevronDown size={14} />
            </button>
          </div>
          {expandedRoute === route.id && <div className="company-route-stops">{route.stops.map((stop, index) => (
            <div className="company-route-stop" key={stop.id}><span className="company-route-stop-number">{index + 1}</span><div><strong>{stop.customer}</strong><small>{stop.address} {stop.time ? `· ${stop.time}` : ''}</small></div><span className={`company-route-stop-status ${stop.status.toLowerCase().replaceAll(' ', '-')}`}>{stop.status}</span></div>
          ))}</div>}
          <div className="company-route-actions">
            {route.status === 'Planned' && <button className="approve-action" onClick={() => void updateStatus(route, 'In Progress')}><Clock3 size={13} /> Start route</button>}
            {route.status === 'In Progress' && <button className="approve-action" onClick={() => void updateStatus(route, 'Completed')}><Check size={13} /> Complete route</button>}
            <button className="delete-action" onClick={() => void deleteRoute(route)}><Trash2 size={13} /> Delete</button>
          </div>
        </article>
      ))}
    </section>
    {showForm && <PlanRouteDialog data={data} onClose={() => setShowForm(false)} onSaved={async () => { setShowForm(false); await loadRoutes() }} />}
  </>
}

function PlanRouteDialog({ data, onClose, onSaved }: { data: RouteData; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [staffId, setStaffId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [collectionIds, setCollectionIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggleCollection = (id: string) => {
    setCollectionIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (collectionIds.length === 0) { setError('Select at least one collection stop.'); return }
    setError('')
    setSubmitting(true)
    try {
      const response = await companyFetch('/api/company/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, area, date, staffId: staffId || null, vehicleId: vehicleId || null, collectionIds }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Route could not be created.')
      await onSaved()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Route could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="company-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="company-modal company-route-modal" onMouseDown={(event) => event.stopPropagation()}>
      <div className="company-modal-header"><div><p className="section-kicker"><span className="kicker-line" /> DISPATCH PLANNING</p><h2>Plan a route</h2></div><button className="company-modal-close" onClick={onClose} aria-label="Close route form"><X size={16} /></button></div>
      {data.unassignedCollections.length === 0 ? <><p className="company-route-no-stops">There are no unassigned collections available. Schedule collections first, or remove a route to make its stops available again.</p><div className="company-modal-actions"><button className="dialog-cancel" onClick={onClose}>Close</button></div></> : (
        <form onSubmit={submit} className="company-form">
          <label>Route name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Kigali Central AM" required maxLength={255} /></label>
          <label>Service area<input value={area} onChange={(event) => setArea(event.target.value)} placeholder="e.g. Nyarugenge" required maxLength={255} /></label>
          <label>Route date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
          <label>Driver / staff member<select value={staffId} onChange={(event) => setStaffId(event.target.value)}><option value="">No driver assigned</option>{data.staff.map((member) => <option value={member.id} key={member.id}>{member.name} · {member.position}</option>)}</select></label>
          <label>Vehicle<select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}><option value="">No vehicle assigned</option>{data.vehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.plateNumber} · {vehicle.type}</option>)}</select></label>
          <fieldset className="company-route-collection-picker"><legend>Collection stops ({collectionIds.length} selected)</legend>{data.unassignedCollections.map((stop) => <label key={stop.id}><input type="checkbox" checked={collectionIds.includes(stop.id)} onChange={() => toggleCollection(stop.id)} /><span><strong>{stop.customer}</strong><small>{stop.address} · {stop.date ? formatDate(stop.date) : 'Date not set'}{stop.time ? ` · ${stop.time}` : ''}</small></span></label>)}</fieldset>
          {error && <p className="settings-error" role="alert">{error}</p>}
          <div className="company-form-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="admin-save" disabled={submitting}>{submitting ? 'Saving route...' : 'Create route'}</button></div>
        </form>
      )}
    </section>
  </div>
}
