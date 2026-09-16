# Shared primitives
React 19 + Astryx 0.6.1 npm primitives; no local primitive wrappers are used on the landing page. Legacy preview/ai-elements is unused by the current build. The reusable conversation module is below.

## src/app/ai-chat/page.tsx
```
// Adapted from Astryx ai-chat (Meta Platforms, Inc. and affiliates).
import {useState} from 'react'
import {VStack, HStack} from '@astryxdesign/core/Stack'
import {Section} from '@astryxdesign/core/Section'
import {Text} from '@astryxdesign/core/Text'
import {Button} from '@astryxdesign/core/Button'
import {Table, proportional, pixel} from '@astryxdesign/core/Table'
import {ChatMessage, ChatMessageBubble} from '@astryxdesign/core/Chat'

const demos = [
  {name: 'Spending', question: 'Where did my grocery budget go this month?', tool: 'transactions', intro: 'You spent $512.40 on groceries. Here’s the breakdown:', heading: 'Merchant', rows: [['Corner Market', '$188.20'], ['Green Grocer', '$141.75'], ['Harbor Foods', '$182.45']], summary: 'That’s $12.40 over your $500 budget.'},
  {name: 'Bills', question: 'Which bills are coming up this week?', tool: 'recurring expenses', intro: 'Three upcoming bills total $124.00:', heading: 'Bill', rows: [['Internet · Sep 16', '$65.00'], ['Phone · Sep 18', '$45.00'], ['Music · Sep 20', '$14.00']], summary: 'Your internet bill is next, on September 16.'},
  {name: 'Accounts', question: 'How much is in my cash accounts?', tool: 'account balances', intro: 'Your cash accounts total $8,250.00:', heading: 'Account', rows: [['Checking', '$2,400.00'], ['Savings', '$5,750.00'], ['Cash wallet', '$100.00']], summary: 'Savings holds $5,750.00 of your cash balance.'},
]
export default function AIChat() {
  const [active, setActive] = useState(0)
  const demo = demos[active]
  return <Section padding={5}>
    <VStack gap={5}>
      <VStack gap={4} minHeight={360} as="section" aria-label={demo.name + ' example'} aria-live="polite">
        <ChatMessage sender="user"><ChatMessageBubble>{demo.question}</ChatMessageBubble></ChatMessage>
        <ChatMessage sender="assistant">
          <ChatMessageBubble variant="ghost" width="100%">
            <VStack gap={4}>
              <Text>{demo.intro}</Text>
              <Table data={demo.rows.map(([label, amount]) => ({label, amount}))} idKey="label" density="balanced" columns={[
                {key: 'label', header: demo.heading, width: proportional(1)},
                {key: 'amount', header: 'Amount', width: pixel(110), align: 'end', renderCell: value => <Text hasTabularNumbers>{String(value.amount)}</Text>},
              ]} />
              <Text weight="semibold">{demo.summary}</Text>
            </VStack>
          </ChatMessageBubble>
        </ChatMessage>
      </VStack>
      <HStack gap={2} wrap="wrap" as="nav" aria-label="Try another example question">
        {demos.map((item, index) => index !== active && <Button key={item.name}
          label={['What did I spend on groceries?', 'Any bills coming up?', 'How much cash do I have?'][index]}
          variant="secondary" onClick={() => setActive(index)} />)}
      </HStack>
    </VStack>
  </Section>
}

```
