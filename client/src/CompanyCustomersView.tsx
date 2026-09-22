import { useEffect, useState } from 'react'
import { Check, ChevronRight, Eye, Plus, Trash2, X } from 'lucide-react'
import './App.css'

type CustomerStatus = 'Active' | 'Suspended' | 'Archived'
type Customer = { id: string; name: string; phone?: string; location: string; plan: string; balance: string; status: CustomerStatus }
const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export default function CompanyCustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const loadCustomers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/customers`)
      const result = await response.json() as Customer[] | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Customers could not be loaded')
      setCustomers(result as Customer[])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Customers could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadCustomers() }, [])

  const updateStatus = async (customer: Customer, status: CustomerStatus) => {
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/customers/${customer.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      const result = await response.json() as Customer | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Customer status could not be updated')
      setCustomers((items) => items.map((item) => item.id === customer.id ? result as Customer : item))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Customer status could not be updated')
    }
  }

  const deleteCustomer = async (customer: Customer) => {
    if (!window.confirm(`Delete ${customer.name}? This cannot be undone.`)) return
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/customers/${customer.id}`, { method: 'DELETE' })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Customer could not be deleted')
      setCustomers((items) => items.filter((item) => item.id !== customer.id))
      setSelectedCustomer(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Customer could not be deleted')
    }
  }

  const stats = [
    ['Total customers', customers.length, 'green'],
    ['Active customers', customers.filter((c) => c.status === 'Active').length, 'blue'],
    ['Suspended customers', customers.filter((c) => c.status === 'Suspended').length, 'yellow'],
    ['Pending payments', customers.filter((c) => c.balance !== '$0.00').length, 'coral'],
  ] as const

  return <><div className="admin-heading"><div><p className="section-kicker"><span className="kicker-line" /> CUSTOMER MANAGEMENT</p><h1>Customers</h1><p>Manage your household customers and service plans.</p></div><button className="admin-action" onClick={() => setShowAddForm(true)}><Plus size={14} /> Add customer</button></div>{error && <p className="settings-error company-error">{error}</p>}<section className="company-stats">{stats.map(([label, value, tone]) => <div className={`company-stat ${tone}`} key={label}><small>{label}</small><strong>{loading ? '...' : value}</strong><span>Database record</span></div>)}</section><section className="admin-panel company-list"><div className="admin-panel-heading"><div><h2>Customer list</h2><p>View, manage or update customer accounts.</p></div><button onClick={() => void loadCustomers()}>Refresh <ChevronRight size={14} /></button></div>{loading ? <p className="company-loading">Loading customers...</p> : customers.length === 0 ? <p className="company-loading">No customers registered yet.</p> : customers.map((customer) => <div className="company-status-row" key={customer.id}><span className="customer-symbol"><span>{customer.name.slice(0, 2).toUpperCase()}</span></span><div><strong>{customer.name}</strong><small>{customer.location} · {customer.plan}</small></div><span className={`company-status ${customer.status === 'Active' ? 'green' : customer.status === 'Suspended' ? 'yellow' : 'coral'}`}>{customer.status}</span><div className="company-actions"><button className="view-action" onClick={() => setSelectedCustomer(customer)}><Eye size={13} /> View</button>{customer.status !== 'Active' && <button className="approve-action" onClick={() => void updateStatus(customer, 'Active')}><Check size={13} /> Activate</button>}{customer.status !== 'Suspended' && <button className="cancel-action" onClick={() => void updateStatus(customer, 'Suspended')}><X size={13} /> Suspend</button>}<button className="delete-action" onClick={() => void deleteCustomer(customer)}><Trash2 size={13} /> Delete</button></div></div>)}</section>{selectedCustomer && <CustomerDetails customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onDelete={() => void deleteCustomer(selectedCustomer)} />}{showAddForm && <AddCustomerForm onClose={() => setShowAddForm(false)} onSuccess={() => { setShowAddForm(false); void loadCustomers() }} />}</>
}

function CustomerDetails({ customer, onClose, onDelete }: { customer: Customer; onClose: () => void; onDelete: () => void }) {
  return <div className="company-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="company-modal"><button className="company-modal-close" onClick={onClose} aria-label="Close customer details"><X size={18} /></button><div className="company-modal-icon"><span>{customer.name.slice(0, 2).toUpperCase()}</span></div><p className="section-kicker"><span className="kicker-line" /> CUSTOMER RECORD</p><h2>{customer.name}</h2><span className={`company-status ${customer.status === 'Active' ? 'green' : customer.status === 'Suspended' ? 'yellow' : 'coral'}`}>{customer.status}</span><div className="company-detail-grid"><div><small>Customer ID</small><strong>{customer.id}</strong></div><div><small>Phone</small><strong>{customer.phone ?? 'Not provided'}</strong></div><div><small>Service plan</small><strong>{customer.plan}</strong></div><div><small>Balance</small><strong>{customer.balance}</strong></div><div className="detail-wide"><small>Location</small><strong>{customer.location}</strong></div></div><div className="company-modal-actions"><button className="dialog-cancel" onClick={onClose}>Close</button><button className="delete-action" onClick={onDelete}><Trash2 size={13} /> Delete customer</button></div></section></div>
}

function AddCustomerForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [plan, setPlan] = useState('Weekly · 240 kg')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !location) { setError('Name and location are required'); return }
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, location, plan }) })
      const result = await response.json() as Customer | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Customer could not be created')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Customer could not be created')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="company-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="company-modal"><button className="company-modal-close" onClick={onClose} aria-label="Close form"><X size={18} /></button><p className="section-kicker"><span className="kicker-line" /> NEW CUSTOMER</p><h2>Add customer</h2><form onSubmit={handleSubmit}><div className="form-group"><label>Customer name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter customer name" required /></div><div className="form-group"><label>Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" /></div><div className="form-group"><label>Location</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter service location" required /></div><div className="form-group"><label>Service plan</label><select value={plan} onChange={(e) => setPlan(e.target.value)}><option>Weekly · 240 kg</option><option>Weekly · 480 kg</option><option>Bi-weekly · 240 kg</option><option>Monthly · 960 kg</option></select></div>{error && <p className="settings-error">{error}</p>}<div className="company-modal-actions"><button type="button" className="dialog-cancel" onClick={onClose}>Cancel</button><button type="submit" className="dialog-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add customer'}</button></div></form></section></div>
}
