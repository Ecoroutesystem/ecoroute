import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, Bot, CircleAlert, Sparkles, UserRound } from 'lucide-react'
import './AdminAssistant.css'

type AdminAssistantProps = { token: string }
type Message = { role: 'assistant' | 'user'; text: string }
type AssistantResponse = { answer?: string; error?: string; model?: string; asOf?: string }

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'
const suggestions = [
  { title: 'Today at a glance', prompt: 'Summarize today\'s collections and current company approvals.' },
  { title: 'Payment pulse', prompt: 'How are payments performing this month? Include the total and payment methods.' },
  { title: 'Upcoming collections', prompt: 'What collection activity is coming up over the next seven days?' },
  { title: 'Outstanding balances', prompt: 'Summarize active customers and outstanding balances.' },
]

export default function AdminAssistant({ token }: AdminAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [modelName, setModelName] = useState('gemini-3.8-flash')
  const conversationEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  const ask = async (question: string) => {
    const text = question.trim()
    if (!text || busy) return
    setMessages((current) => [...current, { role: 'user', text }])
    setInput('')
    setError('')
    setBusy(true)
    try {
      const response = await fetch(`${apiBase}/api/admin/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      })
      const result = await response.json() as AssistantResponse
      if (!response.ok) throw new Error(result.error ?? 'The assistant could not answer right now.')
      if (!result.answer) throw new Error('The assistant returned an empty response. Please try again.')
      setMessages((current) => [...current, { role: 'assistant', text: result.answer as string }])
      if (result.model) setModelName(result.model)
      setUpdatedAt(result.asOf ? new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(result.asOf)) : '')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The assistant could not answer right now.')
    } finally {
      setBusy(false)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void ask(input)
  }

  return <section className="admin-assistant" aria-labelledby="assistant-title">
    <header className="assistant-heading">
      <div>
        <p className="assistant-eyebrow"><span /> ECOROUTE OPERATIONS</p>
        <h1 id="assistant-title">AI Assistant</h1>
        <p>Ask about collection activity, company approvals and payment trends.</p>
      </div>
      <div className="assistant-availability"><i /> Connected to Gemini</div>
    </header>

    <div className="assistant-workspace">
      <div className="assistant-conversation" aria-live="polite">
        {messages.length === 0 ? <div className="assistant-welcome">
          <span className="assistant-orbit"><Sparkles size={20} /></span>
          <p className="assistant-overline">OPERATIONS, AT A GLANCE</p>
          <h2>What would you like to know?</h2>
          <p className="assistant-welcome-copy">Get grounded answers from EcoRoute&apos;s current operational totals. Individual customer records aren&apos;t included.</p>
          <div className="assistant-suggestions">
            {suggestions.map(({ title, prompt }, index) => <button key={title} className={`assistant-suggestion suggestion-${index + 1}`} onClick={() => void ask(prompt)} disabled={busy}>
              <span>{title}</span><strong>{prompt}</strong>
            </button>)}
          </div>
        </div> : <div className="assistant-message-list">
          {messages.map((message, index) => <article className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}>
            <span className="assistant-message-icon">{message.role === 'assistant' ? <Bot size={16} /> : <UserRound size={15} />}</span>
            <div><small>{message.role === 'assistant' ? 'ECOROUTE AI' : 'YOU'}</small><p>{message.text}</p></div>
          </article>)}
          {busy && <article className="assistant-message assistant is-loading"><span className="assistant-message-icon"><Bot size={16} /></span><div><small>ECOROUTE AI</small><p className="assistant-thinking"><i /><i /><i /><span>Reviewing current records</span></p></div></article>}
          <div ref={conversationEnd} />
        </div>}
        {error && <div className="assistant-error" role="alert"><CircleAlert size={16} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error">Dismiss</button></div>}
      </div>

      <form className="assistant-composer" onSubmit={submit}>
        <label htmlFor="assistant-question">Ask about EcoRoute operations</label>
        <div className="assistant-input-row">
          <textarea id="assistant-question" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(input) } }} placeholder="For example, how many collections are scheduled today?" maxLength={2000} rows={2} disabled={busy} />
          <button type="submit" aria-label="Send question" title="Send question" disabled={!input.trim() || busy}><ArrowUp size={18} /></button>
        </div>
        <div className="assistant-composer-footer"><span>Answers use aggregate operational data only.</span><span>{input.length}/2,000</span></div>
      </form>
    </div>
    <footer className="assistant-footnote"><span><i /> {modelName.replace(/^gemini-/, 'Gemini ').replaceAll('-', ' ')}</span>{updatedAt && <span>Data snapshot refreshed at {updatedAt}</span>}</footer>
  </section>
}
