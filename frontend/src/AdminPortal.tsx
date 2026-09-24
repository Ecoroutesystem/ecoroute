import { useState } from 'react'
import { Bot, Building2, ChevronRight, FileText, KeyRound, LayoutDashboard, LogOut, Settings, ShieldCheck, Smartphone } from 'lucide-react'
import CompaniesView from './CompaniesView'
import AdminDashboard from './AdminDashboard'
import './App.css'

type AdminPortalProps = { email: string; onLogout: () => void }
const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Companies', icon: Building2 },
  { label: 'Subscription', icon: FileText },
  { label: 'SMS', icon: Smartphone },
  { label: 'AI Assistant', icon: Bot },
  { label: 'Settings', icon: Settings },
]

export default function AdminPortal({ email, onLogout }: AdminPortalProps) {
  const [activeView, setActiveView] = useState('Dashboard')
  const avatar = 'AD'
  return <div className="admin-portal"><aside className="admin-sidebar"><div className="admin-brand"><span className="logo-mark"><ShieldCheck size={17} /></span><span><strong>EcoRoute</strong><small>System administration</small></span></div><p className="portal-label">Admin workspace</p><nav className="admin-nav">{navigation.map(({ label, icon: Icon }) => <button key={label} className={activeView === label ? 'active' : ''} onClick={() => setActiveView(label)}><Icon size={17} /><span>{label}</span>{label === 'Companies' && <i>2</i>}</button>)}</nav><button className="admin-logout" onClick={onLogout}><LogOut size={17} /> Logout</button></aside><main className="admin-main"><header className="admin-topbar"><div><span className="portal-breadcrumb">Admin /</span> {activeView}</div><div className="admin-user"><span className="admin-avatar">{avatar}</span><span><strong>System Administrator</strong><small>{email}</small></span></div></header><div className="admin-content">{activeView === 'Dashboard' ? <AdminDashboard onOpen={setActiveView} /> : activeView === 'Companies' ? <CompaniesView /> : activeView === 'Settings' ? <SettingsView email={email} /> : <AdminView title={activeView} onLogout={onLogout} />}</div></main></div>
}

function SettingsView({ email }: { email: string }) {
  return <section className="admin-empty"><div className="admin-empty-icon"><KeyRound size={23} /></div><h1>Admin settings</h1><p>Logged in as <strong>{email}</strong>. Update your admin email and password in the backend environment file to change the local admin account.</p><button className="admin-action" onClick={() => window.location.reload()}>Refresh admin panel <ChevronRight size={15} /></button></section>
}

function AdminView({ title, onLogout }: { title: string; onLogout: () => void }) { return <section className="admin-empty"><div className="admin-empty-icon"><Settings size={23} /></div><h1>{title}</h1><p>This administrator workspace is ready for live platform records and controls.</p><button className="admin-action" onClick={onLogout}>Return to public site <ChevronRight size={15} /></button></section> }
