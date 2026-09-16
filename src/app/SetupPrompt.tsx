import {useState} from 'react'
import {VStack} from '@astryxdesign/core/Stack'
import {Text} from '@astryxdesign/core/Text'
import {Button} from '@astryxdesign/core/Button'
import {Selector, SelectorOption} from '@astryxdesign/core/Selector'
import {Token} from '@astryxdesign/core/Token'
import {CodeBlock} from '@astryxdesign/core/CodeBlock'
import {Link} from '@astryxdesign/core/Link'
import {Collapsible} from '@astryxdesign/core/Collapsible'
import {clients, cursorInstallUrl} from './client-installation.mjs'

const icons: Record<string, string> = {chatgpt: 'chatgpt.svg', 'claude-chat': 'claude.png', grok: 'grok.svg', codex: 'codex.svg', claude: 'claude.png', cursor: 'cursor.svg', cowork: 'claude.png'}
const option = (client: typeof clients[number]) => ({value: client.value, label: client.label, icon: icons[client.value] ? <img src={'/client-icons/' + icons[client.value]} width="20" height="20" alt="" /> : undefined})
const comingSoon = new Set(['chatgpt', 'claude-chat', 'grok', 'cowork'])

export default function SetupPrompt() {
  const [selected, setSelected] = useState('codex')
  const client = clients.find(({value}) => value === selected)!
  return <VStack gap={5} width="100%">
    <Selector label="Choose your app" value={selected} onChange={setSelected}
      options={[...clients].sort((a, b) => Number(a.value === 'other') - Number(b.value === 'other') || Number(comingSoon.has(a.value)) - Number(comingSoon.has(b.value)) || a.label.localeCompare(b.label)).map(option)}
      renderOption={item => <SelectorOption label={item.label} icon={item.icon} endContent={comingSoon.has(item.value) ? <Token label="Coming soon" size="sm" /> : undefined} />}
      width="100%" />
    <VStack key={selected} gap={4} aria-live="polite">
      <Text as="p">{client.description}</Text>
      {client.code && <CodeBlock code={client.code} width="100%" isWrapped title={selected === 'claude' ? 'Run in Claude Code' : 'Connection details'} />}
      {selected === 'cursor' && <Button label="Add to Cursor" href={cursorInstallUrl} variant="primary" width="fit-content" />}
      {selected !== 'codex' && <Text as="p" type="supporting">{client.next}</Text>}
      <VStack gap={2}>
      {client.command && <Collapsible trigger={<Text type="supporting">Advanced setup</Text>} defaultIsOpen={false}>
        <CodeBlock code={client.command} width="100%" isWrapped title={selected === 'claude' ? 'Run in Claude Code' : 'Run in your terminal'} />
      </Collapsible>}
      <Link type="supporting" color="secondary" href={'https://github.com/n3wth/lunchmoney-mcp/blob/main/' + client.guide}>Read the setup guide</Link>
      </VStack>
    </VStack>
  </VStack>
}
