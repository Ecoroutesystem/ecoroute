import { useEffect, useState, type FormEvent } from 'react'
import { Bell, CalendarDays, Check, CheckCheck, ChevronRight, MessageCircle, Send, Wallet } from 'lucide-react'
import './App.css'

type Customer = { id: string; name: string; phone?: string; location: string; plan: string; balance: string; status: string }
type Collection = { id: string; time: string; date: string; address: string; customer: string; driver: string; vehicle: string; status: string }
type Message = { id: string; customerId: string; customer?: string; senderRole: 'customer' | 'company'; body: string; sentAt: string }
const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const formatDate = (value: string) => new Date(value).toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' })
const formatTime = (value: string) => new Date(value).toLocaleTimeString('en-RW', { hour: 'numeric', minute: '2-digit' })

export function CustomerNotificationsView({ customer, collections, onOpen }: { customer: Customer | null; collections: Collection[]; onOpen: (view: string) => void }) {
  const [filter, setFilter] = useState<'All' | 'Unread'>('All')
  const [readIds, setReadIds] = useState<string[]>([])
  const customerCollections = collections.filter((collection) => collection.customer === customer?.name)
  const nextCollection = [...customerCollections]
    .filter((collection) => collection.status === 'Scheduled' || collection.status === 'In Progress')
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0]
  const amountDue = customer ? Number(customer.balance.replace(/[^0-9.]/g, '') || 0) : 0
  const notifications = [
    ...(amountDue > 0 ? [{ id: 'balance-due', title: 'Payment balance due', body: `Your account has an outstanding balance of ${customer?.balance}.`, date: new Date().toISOString(), kind: 'payment' as const, action: 'Payments' }] : []),
    ...(nextCollection ? [{ id: `collection-${nextCollection.id}`, title: nextCollection.status === 'In Progress' ? 'Collection in progress' : 'Upcoming collection', body: `${nextCollection.date} at ${nextCollection.time} · ${nextCollection.address}`, date: `${nextCollection.date}T${nextCollection.time || '09:00'}`, kind: 'collection' as const, action: 'My Collections' }] : []),
    { id: 'service-active', title: 'Service is active', body: `${customer?.plan ?? 'Your service plan'} is currently ${customer?.status?.toLowerCase() ?? 'available'}.`, date: new Date().toISOString(), kind: 'service' as const, action: 'Settings' },
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const unreadCount = notifications.filter((notification) => !readIds.includes(notification.id)).length
  const shownNotifications = filter === 'Unread' ? notifications.filter((notification) => !readIds.includes(notification.id)) : notifications
  const markAllRead = () => setReadIds(notifications.map((notification) => notification.id))

  return <>
    <div className="customer-heading"><div><p className="section-kicker"><span className="kicker-line" /> SERVICE UPDATES</p><h1>Notifications</h1><p>Collection reminders, account notices and service updates.</p></div><span className="service-badge"><i /> {unreadCount} unread</span></div>
    <section className="customer-panel communications-panel"><div className="communication-toolbar"><div className="communication-tabs" role="tablist" aria-label="Notification filter"><button className={filter === 'All' ? 'active' : ''} onClick={() => setFilter('All')}>All <span>{notifications.length}</span></button><button className={filter === 'Unread' ? 'active' : ''} onClick={() => setFilter('Unread')}>Unread <span>{unreadCount}</span></button></div><button className="communication-quiet-action" onClick={markAllRead} disabled={unreadCount === 0}><CheckCheck size={14} /> Mark all read</button></div>
      {shownNotifications.length === 0 ? <div className="communication-empty"><span><Bell size={19} /></span><strong>You’re all caught up</strong><p>New service and account updates will appear here.</p></div> : shownNotifications.map((notification) => {
        const Icon = notification.kind === 'payment' ? Wallet : notification.kind === 'collection' ? CalendarDays : Check
        const unread = !readIds.includes(notification.id)
        return <article className={`notification-row ${unread ? 'unread' : ''}`} key={notification.id}>
          <span className={`notification-icon ${notification.kind}`}><Icon size={16} /></span>
          <div className="notification-copy"><div><strong>{notification.title}</strong>{unread && <i aria-label="Unread" />}</div><p>{notification.body}</p><small>{formatDate(notification.date)}</small></div>
          <button className="notification-open" onClick={() => { setReadIds((ids) => ids.includes(notification.id) ? ids : [...ids, notification.id]); onOpen(notification.action) }} aria-label={`Open ${notification.action}`}><ChevronRight size={17} /></button>
        </article>
      })}
    </section>
  </>
}

export function CustomerMessagesView({ customer }: { customer: Customer | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!customer?.id) return
    let active = true
    void fetch(`${apiBase}/api/messages?customerId=${encodeURIComponent(customer.id)}`)
      .then(async (response) => {
        const result = await response.json() as Message[] | { error?: string }
        if (!response.ok) throw new Error('error' in result ? result.error : 'Messages could not be loaded')
        if (active) setMessages(result as Message[])
      })
      .catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Messages could not be loaded') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [customer?.id])

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = draft.trim()
    if (!customer?.id || !body) return
    setSending(true)
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, senderRole: 'customer', body }),
      })
      const result = await response.json() as Message | { error?: string }
      if (!response.ok) throw new Error('error' in result ? result.error : 'Message could not be sent')
      setMessages((items) => [...items, result as Message])
      setDraft('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Message could not be sent')
    } finally {
      setSending(false)
    }
  }

  return <>
    <div className="customer-heading"><div><p className="section-kicker"><span className="kicker-line" /> CUSTOMER SUPPORT</p><h1>Messages</h1><p>Contact your collection company about your service.</p></div><span className="service-badge"><i /> Company support</span></div>
    {error && <p className="settings-error">{error}</p>}
    <section className="customer-panel messages-panel"><header className="messages-header"><span className="messages-company-mark"><MessageCircle size={17} /></span><div><strong>Collection company</strong><small>Service conversation · {customer?.name ?? 'Household'}</small></div><span className="messages-online"><i /> Active service</span></header>
      <div className="messages-thread" aria-live="polite">
        {loading ? <p className="company-loading">Loading conversation...</p> : messages.length === 0 ? <div className="communication-empty"><span><MessageCircle size={19} /></span><strong>Start a conversation</strong><p>Ask about collections, payments, or your service plan.</p></div> : messages.map((message) => <article className={`message-bubble-row ${message.senderRole === 'customer' ? 'outgoing' : 'incoming'}`} key={message.id}><div className="message-bubble"><p>{message.body}</p><small>{message.senderRole === 'customer' ? 'You' : 'Company'} · {formatTime(message.sentAt)}</small></div></article>)}
      </div>
      <form className="message-composer" onSubmit={sendMessage}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message to your collection company..." maxLength={4000} aria-label="Message" disabled={!customer?.id || sending} /><div><small>{draft.length}/4000</small><button type="submit" disabled={!draft.trim() || sending || !customer?.id}><Send size={15} /> {sending ? 'Sending...' : 'Send message'}</button></div></form>
    </section>
  </>
}
