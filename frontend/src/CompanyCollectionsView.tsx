import { useEffect, useState } from 'react'
import { Calendar, Check, ChevronRight, Clock, Plus, Trash2, X } from 'lucide-react'
import './App.css'

type CollectionStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Missed' | 'Cancelled'
type Collection = { id: string; time: string; date: string; address: string; customer: string; driver: string; vehicle: string; status: CollectionStatus }
const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export default function CompanyCollectionsView() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const loadCollections = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/collections`)
      const result = await response.json() as Collection[] | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Collections could not be loaded')
      setCollections(result as Collection[])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Collections could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadCollections() }, [])

  const updateStatus = async (collection: Collection, status: CollectionStatus) => {
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/collections/${collection.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      const result = await response.json() as Collection | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Collection status could not be updated')
      setCollections((items) => items.map((item) => item.id === collection.id ? result as Collection : item))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Collection status could not be updated')
    }
  }

  const deleteCollection = async (collection: Collection) => {
    if (!window.confirm(`Delete collection ${collection.id}? This cannot be undone.`)) return
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/collections/${collection.id}`, { method: 'DELETE' })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Collection could not be deleted')
      setCollections((items) => items.filter((item) => item.id !== collection.id))
      setSelectedCollection(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Collection could not be deleted')
    }
  }

  const stats = [
    ['Total collections', collections.length, 'green'],
    ['Scheduled', collections.filter((c) => c.status === 'Scheduled').length, 'blue'],
    ['In Progress', collections.filter((c) => c.status === 'In Progress').length, 'yellow'],
    ['Completed', collections.filter((c) => c.status === 'Completed').length, 'coral'],
  ] as const

  return <><div className="admin-heading"><div><p className="section-kicker"><span className="kicker-line" /> COLLECTION MANAGEMENT</p><h1>Collections</h1><p>Schedule and track waste collection visits.</p></div><button className="admin-action" onClick={() => setShowAddForm(true)}><Plus size={14} /> Add collection</button></div>{error && <p className="settings-error company-error">{error}</p>}<section className="company-stats">{stats.map(([label, value, tone]) => <div className={`company-stat ${tone}`} key={label}><small>{label}</small><strong>{loading ? '...' : value}</strong><span>Database record</span></div>)}</section><section className="admin-panel company-list"><div className="admin-panel-heading"><div><h2>Collection schedule</h2><p>View and manage upcoming collections.</p></div><button onClick={() => void loadCollections()}>Refresh <ChevronRight size={14} /></button></div>{loading ? <p className="company-loading">Loading collections...</p> : collections.length === 0 ? <p className="company-loading">No collections scheduled yet.</p> : collections.map((collection) => <div className="collection-row" key={collection.id}><span className="collection-time">{collection.time}</span><div><strong>{collection.customer}</strong><small>{collection.address} · {collection.driver}</small></div><span className={`status-pill ${collection.status === 'Scheduled' ? 'scheduled' : collection.status === 'In Progress' ? 'in-progress' : collection.status === 'Completed' ? 'completed' : collection.status === 'Missed' ? 'missed' : 'cancelled'}`}>{collection.status}</span><div className="company-actions"><button className="view-action" onClick={() => setSelectedCollection(collection)}><Calendar size={13} /> View</button>{collection.status === 'Scheduled' && <button className="approve-action" onClick={() => void updateStatus(collection, 'In Progress')}><Clock size={13} /> Start</button>}{collection.status === 'In Progress' && <button className="approve-action" onClick={() => void updateStatus(collection, 'Completed')}><Check size={13} /> Complete</button>}<button className="delete-action" onClick={() => void deleteCollection(collection)}><Trash2 size={13} /> Delete</button></div></div>)}</section>{selectedCollection && <CollectionDetails collection={selectedCollection} onClose={() => setSelectedCollection(null)} onDelete={() => void deleteCollection(selectedCollection)} onUpdate={(status) => void updateStatus(selectedCollection, status)} />}{showAddForm && <AddCollectionForm onClose={() => setShowAddForm(false)} onSuccess={() => { setShowAddForm(false); void loadCollections() }} />}</>
}

function CollectionDetails({ collection, onClose, onDelete, onUpdate }: { collection: Collection; onClose: () => void; onDelete: () => void; onUpdate: (status: CollectionStatus) => void }) {
  return <div className="company-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="company-modal"><button className="company-modal-close" onClick={onClose} aria-label="Close collection details"><X size={18} /></button><div className="company-modal-icon"><Calendar size={22} /></div><p className="section-kicker"><span className="kicker-line" /> COLLECTION RECORD</p><h2>{collection.customer}</h2><span className={`company-status ${collection.status === 'Completed' ? 'green' : collection.status === 'In Progress' ? 'yellow' : collection.status === 'Scheduled' ? 'blue' : 'coral'}`}>{collection.status}</span><div className="company-detail-grid"><div><small>Collection ID</small><strong>{collection.id}</strong></div><div><small>Date</small><strong>{collection.date}</strong></div><div><small>Time</small><strong>{collection.time}</strong></div><div><small>Driver</small><strong>{collection.driver}</strong></div><div><small>Vehicle</small><strong>{collection.vehicle}</strong></div><div className="detail-wide"><small>Address</small><strong>{collection.address}</strong></div></div><div className="company-modal-actions"><button className="dialog-cancel" onClick={onClose}>Close</button>{collection.status === 'Scheduled' && <button className="dialog-primary" onClick={() => onUpdate('In Progress')}>Start collection</button>}{collection.status === 'In Progress' && <button className="dialog-primary" onClick={() => onUpdate('Completed')}>Mark complete</button>}<button className="delete-action" onClick={onDelete}><Trash2 size={13} /> Delete</button></div></section></div>
}

function AddCollectionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const [address, setAddress] = useState('')
  const [customer, setCustomer] = useState('')
  const [driver, setDriver] = useState('Unassigned')
  const [vehicle, setVehicle] = useState('Unassigned')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!time || !date || !address || !customer) { setError('Time, date, address and customer are required'); return }
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/collections`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ time, date, address, customer, driver, vehicle }) })
      const result = await response.json() as Collection | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Collection could not be created')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Collection could not be created')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="company-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="company-modal"><button className="company-modal-close" onClick={onClose} aria-label="Close form"><X size={18} /></button><p className="section-kicker"><span className="kicker-line" /> NEW COLLECTION</p><h2>Add collection</h2><form onSubmit={handleSubmit}><div className="form-group"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div><div className="form-group"><label>Time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></div><div className="form-group"><label>Customer</label><input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Enter customer name" required /></div><div className="form-group"><label>Address</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter collection address" required /></div><div className="form-group"><label>Driver</label><input type="text" value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="Assign driver" /></div><div className="form-group"><label>Vehicle</label><input type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Assign vehicle" /></div>{error && <p className="settings-error">{error}</p>}<div className="company-modal-actions"><button type="button" className="dialog-cancel" onClick={onClose}>Cancel</button><button type="submit" className="dialog-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add collection'}</button></div></form></section></div>
}
