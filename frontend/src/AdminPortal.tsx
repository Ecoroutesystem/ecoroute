import { useState } from 'react'
import { Bot, Building2, Check, ChevronRight, FileText, KeyRound, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Smartphone, X } from 'lucide-react'
import CompaniesView from './CompaniesView'
import AdminDashboard from './AdminDashboard'
import AdminAssistant from './AdminAssistant'
import './App.css'

type AdminPortalProps = { email: string; token: string; onLogout: () => void }
const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Companies', icon: Building2 },
  { label: 'Subscription', icon: FileText },
  { label: 'SMS', icon: Smartphone },
  { label: 'AI Assistant', icon: Bot },
  { label: 'Settings', icon: Settings },
]

export default function AdminPortal({ email, token, onLogout }: AdminPortalProps) {
  const [activeView, setActiveView] = useState('Dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const avatar = 'AD'
  return <div className="admin-portal"><aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}><div className="admin-brand"><span className="logo-mark"><ShieldCheck size={17} /></span><span><strong>EcoRoute</strong><small>System administration</small></span><button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenuOpen}><span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>{mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}</button></div><p className="portal-label">Admin workspace</p><nav className="admin-nav">{navigation.map(({ label, icon: Icon }) => <button key={label} className={activeView === label ? 'active' : ''} onClick={() => { setActiveView(label); setMobileMenuOpen(false) }}><Icon size={17} /><span>{label}</span>{label === 'Companies' && <i>2</i>}</button>)}</nav><button className="admin-logout" onClick={onLogout}><LogOut size={17} /> Logout</button></aside><main className="admin-main"><header className="admin-topbar"><div><span className="portal-breadcrumb">Admin /</span> {activeView}</div><div className="admin-user"><span className="admin-avatar">{avatar}</span><span><strong>System Administrator</strong><small>{email}</small></span></div></header><div className="admin-content">{activeView === 'Dashboard' ? <AdminDashboard onOpen={setActiveView} /> : activeView === 'Companies' ? <CompaniesView /> : activeView === 'AI Assistant' ? <AdminAssistant token={token} /> : activeView === 'Settings' ? <SettingsView email={email} /> : <AdminView title={activeView} onLogout={onLogout} />}</div></main></div>
}

function SettingsView({ email }: { email: string }) {
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('ecoroute-admin-preferences')
      if (saved) return JSON.parse(saved) as { companyRequests: boolean; securityAlerts: boolean; weeklySummary: boolean }
    } catch {
      localStorage.removeItem('ecoroute-admin-preferences')
    }
    return { companyRequests: true, securityAlerts: true, weeklySummary: false }
  })
  const [saved, setSaved] = useState(false)
  const savePreferences = () => {
    localStorage.setItem('ecoroute-admin-preferences', JSON.stringify(preferences))
    setSaved(true)
  }

  return <>
    <div className="admin-heading"><div><p className="section-kicker"><span className="kicker-line" /> PLATFORM CONFIGURATION</p><h1>Settings</h1><p>Manage administrator access and platform notification preferences.</p></div><span className="admin-status"><i /> System account</span></div>
    {saved && <p className="settings-success"><Check size={14} /> Preferences saved on this device.</p>}
    <section className="settings-grid admin-settings-grid">
      <article className="admin-panel admin-settings-panel"><div className="settings-title"><span className="settings-icon"><KeyRound size={16} /></span><div><h2>Administrator account</h2><p>Current account used to access the EcoRoute control panel.</p></div></div><div className="admin-account-detail"><span className="admin-avatar">AD</span><div><strong>System Administrator</strong><small>{email}</small></div></div><p className="settings-note">Credentials are managed by the server environment. Update <code>ADMIN_EMAIL</code> or <code>ADMIN_PASSWORD</code> in the backend environment file, then restart the server.</p></article>
      <article className="admin-panel admin-settings-panel"><div className="settings-title"><span className="settings-icon"><Settings size={16} /></span><div><h2>Platform notifications</h2><p>Choose which operational updates appear in this workspace.</p></div></div><div className="customer-preference-list"><label><span><strong>Company registration requests</strong><small>New applications awaiting review</small></span><input type="checkbox" checked={preferences.companyRequests} onChange={(event) => setPreferences({ ...preferences, companyRequests: event.target.checked })} /></label><label><span><strong>Security alerts</strong><small>Sign-in and administrator access updates</small></span><input type="checkbox" checked={preferences.securityAlerts} onChange={(event) => setPreferences({ ...preferences, securityAlerts: event.target.checked })} /></label><label><span><strong>Weekly platform summary</strong><small>Operational totals and activity overview</small></span><input type="checkbox" checked={preferences.weeklySummary} onChange={(event) => setPreferences({ ...preferences, weeklySummary: event.target.checked })} /></label></div><button className="admin-save admin-settings-save" onClick={savePreferences}>Save preferences</button></article>
    </section>
  </>
}

function AdminView({ title, onLogout }: { title: string; onLogout: () => void }) { return <section className="admin-empty"><div className="admin-empty-icon"><Settings size={23} /></div><h1>{title}</h1><p>This administrator workspace is ready for live platform records and controls.</p><button className="admin-action" onClick={onLogout}>Return to public site <ChevronRight size={15} /></button></section> }
