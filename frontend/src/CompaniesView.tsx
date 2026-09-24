import { useEffect, useState } from 'react'
import { Building2, Check, ChevronRight, Eye, Trash2, X } from 'lucide-react'
import './App.css'

type CompanyStatus = 'Approved' | 'Pending approval' | 'Cancelled'
type Company = { id: string; name: string; email?: string; phone?: string; address?: string; tin?: string; registration?: string; location: string; status: CompanyStatus }
const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export default function CompaniesView() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const loadCompanies = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/companies`)
      const result = await response.json() as Company[] | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Companies could not be loaded')
      setCompanies(result as Company[])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Companies could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadCompanies() }, [])

  const updateStatus = async (company: Company, action: 'approve' | 'cancel') => {
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/companies/${company.id}/${action}`, { method: 'PATCH' })
      const result = await response.json() as Company | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Company status could not be updated')
      setCompanies((items) => items.map((item) => item.id === company.id ? result as Company : item))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Company status could not be updated')
    }
  }

  const deleteCompany = async (company: Company) => {
    if (!window.confirm(`Delete ${company.name}? This cannot be undone.`)) return
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/companies/${company.id}`, { method: 'DELETE' })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Company could not be deleted')
      setCompanies((items) => items.filter((item) => item.id !== company.id))
      setSelectedCompany(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Company could not be deleted')
    }
  }

  const stats = [
    ['Number of companies', companies.length, 'green'],
    ['Approved companies', companies.filter((company) => company.status === 'Approved').length, 'blue'],
    ['Pending companies', companies.filter((company) => company.status === 'Pending approval').length, 'yellow'],
    ['Cancelled companies', companies.filter((company) => company.status === 'Cancelled').length, 'coral'],
  ] as const

  return <><div className="admin-heading"><div><p className="section-kicker"><span className="kicker-line" /> COMPANY MANAGEMENT</p><h1>Companies</h1><p>Live company records from the EcoRoute database.</p></div></div>{error && <p className="settings-error company-error">{error}</p>}<section className="company-stats">{stats.map(([label, value, tone]) => <div className={`company-stat ${tone}`} key={label}><small>{label}</small><strong>{loading ? '...' : value}</strong><span>Database record</span></div>)}</section><section className="admin-panel company-list"><div className="admin-panel-heading"><div><h2>Company status</h2><p>Approve, cancel, view or delete a company.</p></div><button onClick={() => void loadCompanies()}>Refresh <ChevronRight size={14} /></button></div>{loading ? <p className="company-loading">Loading companies...</p> : companies.length === 0 ? <p className="company-loading">No companies registered yet.</p> : companies.map((company) => <div className="company-status-row" key={company.id}><span className="company-symbol"><Building2 size={15} /></span><div><strong>{company.name}</strong><small>{company.location} · {company.id}</small></div><span className={`company-status ${company.status === 'Approved' ? 'green' : company.status === 'Pending approval' ? 'yellow' : 'coral'}`}>{company.status}</span><div className="company-actions"><button className="view-action" onClick={() => setSelectedCompany(company)}><Eye size={13} /> View</button>{company.status !== 'Approved' && <button className="approve-action" onClick={() => void updateStatus(company, 'approve')}><Check size={13} /> Approve</button>}{company.status !== 'Cancelled' && <button className="cancel-action" onClick={() => void updateStatus(company, 'cancel')}><X size={13} /> Cancel</button>}<button className="delete-action" onClick={() => void deleteCompany(company)}><Trash2 size={13} /> Delete</button></div></div>)}</section>{selectedCompany && <CompanyDetails company={selectedCompany} onClose={() => setSelectedCompany(null)} onDelete={() => void deleteCompany(selectedCompany)} />}</>
}

function CompanyDetails({ company, onClose, onDelete }: { company: Company; onClose: () => void; onDelete: () => void }) { return <div className="company-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="company-modal"><button className="company-modal-close" onClick={onClose} aria-label="Close company details"><X size={18} /></button><div className="company-modal-icon"><Building2 size={22} /></div><p className="section-kicker"><span className="kicker-line" /> COMPANY RECORD</p><h2>{company.name}</h2><span className={`company-status ${company.status === 'Approved' ? 'green' : company.status === 'Pending approval' ? 'yellow' : 'coral'}`}>{company.status}</span><div className="company-detail-grid"><div><small>Company ID</small><strong>{company.id}</strong></div><div><small>TIN</small><strong>{company.tin ?? 'Not provided'}</strong></div><div><small>Email</small><strong>{company.email ?? 'Not provided'}</strong></div><div><small>Phone</small><strong>{company.phone ?? 'Not provided'}</strong></div><div className="detail-wide"><small>Address</small><strong>{company.address ?? company.location}</strong></div></div><div className="company-modal-actions"><button className="dialog-cancel" onClick={onClose}>Close</button><button className="delete-action" onClick={onDelete}><Trash2 size={13} /> Delete company</button></div></section></div> }
