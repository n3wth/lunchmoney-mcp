import {useEffect, useRef, useState} from 'react'
import {VStack, HStack} from '@astryxdesign/core/Stack'
import {Text} from '@astryxdesign/core/Text'
import {ChatMessage, ChatMessageBubble} from '@astryxdesign/core/Chat'
import {Button} from '@astryxdesign/core/Button'

const demos = [
  {name: 'Spending', prompt: 'Where did my grocery budget go?', question: 'Where did my grocery budget go this month?', answer: 'Groceries came to $512.40.', detail: 'That’s $12.40 over your $500 budget. Here’s where it went.', heading: 'Merchant', rows: [['Corner Market', '$188.20'], ['Green Grocer', '$141.75'], ['Harbor Foods', '$182.45']]},
  {name: 'Bills', prompt: 'Which bills are coming up?', question: 'Which bills are coming up this week?', answer: 'Three bills. $124.00 in total.', detail: 'Your internet bill is next, on September 16.', heading: 'Bill', rows: [['Internet · Sep 16', '$65.00'], ['Phone · Sep 18', '$45.00'], ['Music · Sep 20', '$14.00']]},
  {name: 'Accounts', prompt: 'How much cash do I have?', question: 'How much is in my cash accounts?', answer: 'You have $8,250.00 in cash accounts.', detail: 'Most of it is in savings. Here’s the account breakdown.', heading: 'Account', rows: [['Checking', '$2,400.00'], ['Savings', '$5,750.00'], ['Cash wallet', '$100.00']]},
]

export default function AIChat() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerAnimation = useRef<Animation | null>(null)
  const isPaused = useRef(paused)
  isPaused.current = paused

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const button = document.getElementById('demo-tab-' + active)
    if (!button) return
    const start = () => {
      timerAnimation.current?.cancel()
      timerAnimation.current = null
      if (reduced.matches) return
      const animation = button.animate([{backgroundSize: '0% 100%'}, {backgroundSize: '100% 100%'}], {duration: 7000, easing: 'linear', fill: 'forwards'})
      timerAnimation.current = animation
      animation.onfinish = () => setActive(value => (value + 1) % demos.length)
      if (isPaused.current || document.hidden) animation.pause()
    }
    const visibility = () => {
      if (document.hidden || isPaused.current) timerAnimation.current?.pause()
      else timerAnimation.current?.play()
    }
    start()
    reduced.addEventListener('change', start)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      timerAnimation.current?.cancel()
      reduced.removeEventListener('change', start)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [active])

  useEffect(() => {
    if (paused || document.hidden) timerAnimation.current?.pause()
    else timerAnimation.current?.play()
  }, [paused])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const answer = document.getElementById('example-answer-' + active)
    if (!answer) return
    const duration = parseFloat(getComputedStyle(answer).getPropertyValue('--duration-medium')) || 300
    const question = answer.parentElement?.querySelector('article')
    const entrance = [{opacity: 0, transform: 'translateY(8px)'}, {opacity: 1, transform: 'translateY(0)'}]
    const shellAnimation = answer.animate(entrance, {duration, delay: 180, fill: 'backwards', easing: 'ease-out'})
    const questionAnimation = question?.animate(entrance, {duration, fill: 'backwards', easing: 'ease-out'})
    const animations = [...answer.querySelectorAll('[data-reveal]')].map((element, index) =>
      element.animate([{opacity: 0, transform: 'translateY(6px)'}, {opacity: 1, transform: 'translateY(0)'}], {
        duration, delay: 300 + index * 110, fill: 'backwards', easing: 'ease-out',
      }))
    answer.querySelectorAll('[data-bar]').forEach((element, index) => {
      const width = element.getAttribute('width') || '0'
      animations.push(element.animate([{width: '0px'}, {width: width + 'px'}], {
        duration: duration * 2, delay: 520 + index * 110, fill: 'backwards', easing: 'cubic-bezier(.2,.7,.2,1)',
      }))
    })
    return () => {
      questionAnimation?.cancel()
      shellAnimation.cancel()
      animations.forEach(animation => animation.cancel())
    }
  }, [active])

  return <VStack gap={6} aria-label="Example conversation with fictional data" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)}}>
    <VStack className="astryx-demo-stage">
    {demos.map((demo, demoIndex) => <VStack key={demo.name} gap={4} className={demoIndex === active ? 'astryx-demo-slide' : 'astryx-demo-slide astryx-demo-hidden'} aria-hidden={demoIndex !== active}>
    <ChatMessage sender="user">
      <ChatMessageBubble><Text as="p">{demo.question}</Text></ChatMessageBubble>
    </ChatMessage>
    <VStack id={'example-answer-' + demoIndex} as="section" aria-label={demo.name + ' example answer'} maxWidth={600} width="100%">
      <ChatMessage sender="assistant">
        <ChatMessageBubble width="100%">
          <VStack gap={4} className="astryx-demo-answer">
      <Text as="p" weight="semibold" data-reveal>{demo.answer}</Text>
      <Text as="p" color="secondary" data-reveal>{demo.detail}</Text>
      <VStack gap={4} aria-label={demoIndex === 0 ? 'Grocery spending by merchant' : demoIndex === 1 ? 'Bills by due date' : 'Cash by account'}>
        {[...demo.rows].sort((a, b) => demoIndex === 1 ? 0 : Number(b[1].replace(/[$,]/g, '')) - Number(a[1].replace(/[$,]/g, ''))).map(([label, amount], index) => {
          const value = Number(amount.replace(/[$,]/g, ''))
          const colors = ['var(--color-chart-deep)', 'var(--color-chart-teal)', 'var(--color-chart-soft)']
          const total = demo.rows.reduce((sum, row) => sum + Number(row[1].replace(/[$,]/g, '')), 0)
          return <VStack key={label} gap={2} data-reveal>
            <HStack hAlign="between" gap={3}>
              <Text>{label}</Text><Text hasTabularNumbers>{amount}</Text>
            </HStack>
            <svg width="100%" height="10" viewBox="0 0 500 10" preserveAspectRatio="none" aria-hidden="true">
              <rect width="500" height="10" rx="5" fill="var(--color-chart-track)" />
              <rect data-bar width={value / total * 500} height="10" rx="5" fill={colors[index]} />
            </svg>
          </VStack>
        })}
      </VStack>
          </VStack>
        </ChatMessageBubble>
      </ChatMessage>
    </VStack>
    </VStack>)}
    </VStack>
    <HStack gap={2} hAlign="center" as="nav" aria-label="Try another question">
      {demos.map((item, index) => <Button key={item.name} id={'demo-tab-' + index} className={index === active ? 'astryx-demo-timer' : undefined} label={item.name} size="sm" variant={index === active ? 'primary' : 'secondary'} aria-pressed={index === active} onClick={() => setActive(index)} />)}
    </HStack>
  </VStack>
}
