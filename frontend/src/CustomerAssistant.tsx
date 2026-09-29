import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, Bot, CalendarDays, CircleAlert, CreditCard, Sparkles } from 'lucide-react'
import './CustomerAssistant.css'

type Customer = { id: string; name: string; status: string }
type Message = { role: 'assistant' | 'user'; text: string }
type AssistantResponse = { answer?: string; error?: string; model?: string }

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'
const suggestions = [
  { icon: CalendarDays, label: 'My schedule', prompt: 'When is my next collection, and what is my recent collection history?' },
  { icon: CreditCard, label: 'My payments', prompt: 'Summarize my current balance and recent payment history.' },
]

export default function CustomerAssistant() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [modelName, setModelName] = useState('Gemini')
  const conversationEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    void fetch(`${apiBase}/api/customers`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as Customer[] | { error?: string }
        if (!response.ok || !Array.isArray(result)) throw new Error(!Array.isArray(result) ? result.error ?? 'Household profile could not be loaded.' : 'Household profile could not be loaded.')
        setCustomer(result.find((item) => item.status === 'Active') ?? result[0] ?? null)
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error ? requestError.message : 'Household profile could not be loaded.')
      })
      .finally(() => setProfileLoading(false))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  const ask = async (question: string) => {
    const text = question.trim()
    if (!text || busy || !customer) return
    setMessages((current) => [...current, { role: 'user', text }])
    setInput('')
    setError('')
    setBusy(true)
    try {
      const response = await fetch(`${apiBase}/api/customer/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, message: text }),
      })
      const result = await response.json() as AssistantResponse
      if (!response.ok) throw new Error(result.error ?? 'The assistant could not answer right now.')
      if (!result.answer) throw new Error('The assistant returned an empty response. Please try again.')
      setMessages((current) => [...current, { role: 'assistant', text: result.answer as string }])
      if (result.model) setModelName(result.model.replace(/^gemini-/, 'Gemini ').replaceAll('-', ' '))
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

  return <section className="customer-assistant" aria-labelledby="customer-assistant-title">
    <header className="customer-assistant-heading">
      <div>
        <p className="customer-assistant-kicker"><span /> HOUSEHOLD SERVICE</p>
        <h1 id="customer-assistant-title">AI Assistant</h1>
        <p>Ask about your collection schedule, service plan and payments.</p>
      </div>
      <span className="customer-assistant-status"><i /> {customer?.name ?? (profileLoading ? 'Loading household' : 'Household assistant')}</span>
    </header>

    <div className="customer-assistant-frame">
      <div className="customer-assistant-conversation" aria-live="polite">
        {messages.length === 0 ? <div className="customer-assistant-welcome">
          <span className="customer-assistant-mark"><Sparkles size={19} /></span>
          <p className="customer-assistant-overline">YOUR SERVICE, MADE CLEAR</p>
          <h2>How can I help today?</h2>
          <p className="customer-assistant-intro">Get answers using the collection and payment records for your household.</p>
          <div className="customer-assistant-prompts">
            {suggestions.map(({ icon: Icon, label, prompt }) => <button key={label} onClick={() => void ask(prompt)} disabled={profileLoading || !customer || busy}>
              <Icon size={16} /><span><small>{label}</small><strong>{prompt}</strong></span>
            </button>)}
          </div>
          {!profileLoading && !customer && <p className="customer-assistant-empty">No household profile is available for this account yet.</p>}
        </div> : <div className="customer-assistant-messages">
          {messages.map((message, index) => <article className={`customer-assistant-message ${message.role}`} key={`${message.role}-${index}`}>
            <span>{message.role === 'assistant' ? <Bot size={16} /> : <span className="customer-assistant-you">YOU</span>}</span>
            <div><small>{message.role === 'assistant' ? 'ECOROUTE ASSISTANT' : 'YOUR QUESTION'}</small><p>{message.text}</p></div>
          </article>)}
          {busy && <article className="customer-assistant-message assistant"><span><Bot size={16} /></span><div><small>ECOROUTE ASSISTANT</small><p className="customer-assistant-thinking">Checking your service records...</p></div></article>}
          <div ref={conversationEnd} />
        </div>}
        {error && <div className="customer-assistant-error" role="alert"><CircleAlert size={16} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error">Dismiss</button></div>}
      </div>
      <form className="customer-assistant-composer" onSubmit={submit}>
        <label htmlFor="customer-assistant-question">Your question</label>
        <div className="customer-assistant-input">
          <textarea id="customer-assistant-question" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(input) } }} placeholder="Ask about your next collection or balance..." maxLength={2000} rows={2} disabled={profileLoading || !customer || busy} />
          <button type="submit" aria-label="Send question" title="Send question" disabled={!input.trim() || !customer || busy}><ArrowUp size={18} /></button>
        </div>
        <div className="customer-assistant-composer-note"><span>Your answers are based on your household records.</span><span>{input.length}/2,000</span></div>
      </form>
    </div>
    <footer className="customer-assistant-footer"><span><i /> {modelName}</span><span>Personal service information only</span></footer>
  </section>
}
