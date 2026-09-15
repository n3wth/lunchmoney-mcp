import {useEffect, useState} from 'react'
import {VStack, HStack} from '@astryxdesign/core/Stack'
import {Text} from '@astryxdesign/core/Text'
import {ChatMessage, ChatMessageBubble} from '@astryxdesign/core/Chat'
import {Button} from '@astryxdesign/core/Button'
import {Table, proportional, pixel} from '@astryxdesign/core/Table'

const demos = [
  {name: 'Spending', prompt: 'Where did my grocery budget go?', question: 'Where did my grocery budget go this month?', answer: 'Groceries came to $512.40.', detail: 'That’s $12.40 over your $500 budget. Here’s where it went.', heading: 'Merchant', rows: [['Corner Market', '$188.20'], ['Green Grocer', '$141.75'], ['Harbor Foods', '$182.45']]},
  {name: 'Bills', prompt: 'Which bills are coming up?', question: 'Which bills are coming up this week?', answer: 'Three bills. $124.00 in total.', detail: 'Your internet bill is next, on September 16.', heading: 'Bill', rows: [['Internet · Sep 16', '$65.00'], ['Phone · Sep 18', '$45.00'], ['Music · Sep 20', '$14.00']]},
  {name: 'Accounts', prompt: 'How much cash do I have?', question: 'How much is in my cash accounts?', answer: 'You have $8,250.00 in cash accounts.', detail: 'Most of it is in savings. Here’s the account breakdown.', heading: 'Account', rows: [['Checking', '$2,400.00'], ['Savings', '$5,750.00'], ['Cash wallet', '$100.00']]},
]

export default function AIChat() {
  const [active, setActive] = useState(0)
  const demo = demos[active]

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const answer = document.getElementById('example-answer')
    if (!answer) return
    const duration = parseFloat(getComputedStyle(answer).getPropertyValue('--duration-medium')) || 300
    const animation = answer.animate([{opacity: 0.35}, {opacity: 1}], {duration, easing: 'ease-out'})
    return () => animation.cancel()
  }, [active])

  return <VStack gap={8} aria-label="Example conversation with fictional data">
    <ChatMessage sender="user">
      <ChatMessageBubble><Text as="p">{demo.question}</Text></ChatMessageBubble>
    </ChatMessage>
    <VStack id="example-answer" as="section" aria-label={demo.name + ' example answer'} aria-live="polite" maxWidth={600} width="100%">
      <ChatMessage sender="assistant">
        <ChatMessageBubble width="100%">
          <VStack gap={4}>
      <Text as="p" weight="semibold">{demo.answer}</Text>
      <Text as="p" color="secondary">{demo.detail}</Text>
      <Table data={demo.rows.map(([label, amount]) => ({label, amount}))} idKey="label" density="balanced" columns={[
        {key: 'label', header: demo.heading, width: proportional(1)},
        {key: 'amount', header: 'Amount', width: pixel(120), align: 'end', renderCell: value => <Text hasTabularNumbers>{String(value.amount)}</Text>},
      ]} />
          </VStack>
        </ChatMessageBubble>
      </ChatMessage>
    </VStack>
    <HStack gap={3} wrap="wrap" as="nav" aria-label="Try another question">
      {demos.map((item, index) => <Button key={item.name} label={item.prompt} variant={index === active ? 'primary' : 'secondary'} aria-pressed={index === active} onClick={() => setActive(index)} />)}
    </HStack>
  </VStack>
}
