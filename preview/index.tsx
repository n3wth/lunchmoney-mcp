import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Conversation, ConversationContent } from './ai-elements/conversation'
import { Message, MessageContent } from './ai-elements/message'

const demos = [
  { name: 'Spending', question: 'Where did my grocery budget go this month?', tool: 'Reading sample transactions', intro: 'You spent $512.40 on groceries. Here’s the breakdown:', heading: 'Merchant', rows: [['Corner Market', '$188.20'], ['Green Grocer', '$141.75'], ['Harbor Foods', '$182.45']], summary: 'That’s $12.40 over your $500 budget.' },
  { name: 'Bills', question: 'Which bills are coming up this week?', tool: 'Reading sample recurring expenses', intro: 'Three upcoming bills total $124.00:', heading: 'Bill', rows: [['Internet · Sep 16', '$65.00'], ['Phone · Sep 18', '$45.00'], ['Music · Sep 20', '$14.00']], summary: 'Your internet bill is next, on September 16.' },
  { name: 'Accounts', question: 'How much is in my cash accounts?', tool: 'Reading sample account balances', intro: 'Your cash accounts total $8,250.00:', heading: 'Account', rows: [['Checking', '$2,400.00'], ['Savings', '$5,750.00'], ['Cash wallet', '$100.00']], summary: 'Savings holds $5,750.00 of your cash balance.' },
]

function Preview() {
  const container = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [hidden, setHidden] = useState(document.hidden)
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 })
    if (container.current) observer.observe(container.current)
    const update = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])
  useEffect(() => {
    if (paused || hovered || focused || !visible || hidden || reducedMotion) return
    const timer = setInterval(() => setActive(value => (value + 1) % demos.length), 8000)
    return () => clearInterval(timer)
  }, [paused, hovered, focused, visible, hidden, reducedMotion])

  return (
    <div ref={container} role="region" aria-roledescription="carousel" aria-label="Sample conversations" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <div className="lm-slides">
    {demos.map((demo, index) => <div key={demo.name} className={`lm-slide${active === index ? ' lm-active' : ''}`} aria-hidden={active !== index} inert={active !== index} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${demos.length}: ${demo.name}`}>
    <Conversation className="lm-conversation" initial="instant" resize="instant" aria-label="Illustrative conversation using sample data" aria-live="off">
      <ConversationContent className="lm-conversation-content">
        <Message from="user" className="lm-message">
          <MessageContent className="lm-question">{demo.question}</MessageContent>
        </Message>
        <Message from="assistant" className="lm-message lm-assistant">
          <div className="lm-tool-step"><img src="/favicon.svg" alt="" width="16" height="16" />{demo.tool}</div>
          <MessageContent className="lm-answer">
            <p>{demo.intro}</p>
            <table>
              <caption className="sr-only">Fictional {demo.name.toLowerCase()} data</caption>
              <thead><tr><th scope="col">{demo.heading}</th><th scope="col">Amount</th></tr></thead>
              <tbody>{demo.rows.map(([label, amount]) => <tr key={label}><td>{label}</td><td>{amount}</td></tr>)}</tbody>
            </table>
            <p>{demo.summary}</p>
          </MessageContent>
        </Message>
      </ConversationContent>
    </Conversation>
    </div>)}
    </div>
    <div className="lm-controls" role="group" aria-label="Choose a sample conversation">
      {demos.map((demo, index) => <button key={demo.name} type="button" className="lm-dot" aria-label={`Show ${demo.name.toLowerCase()} example`} aria-pressed={active === index} onClick={() => { setActive(index); setPaused(true) }}><span /></button>)}
      {!reducedMotion && <button type="button" className="lm-pause" aria-label={paused ? 'Resume automatic examples' : 'Pause automatic examples'} onClick={() => setPaused(value => !value)}>{paused ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 3 7 5-7 5Z" /></svg> : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zM9 3h3v10H9z" /></svg>}</button>}
    </div>
    </div>
  )
}

const mount = document.getElementById('conversation-preview')
if (mount) createRoot(mount).render(<Preview />)
