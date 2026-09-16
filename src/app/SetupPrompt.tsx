import {useState} from 'react'
import {VStack} from '@astryxdesign/core/Stack'
import {Text} from '@astryxdesign/core/Text'
import {Button} from '@astryxdesign/core/Button'
import {Selector} from '@astryxdesign/core/Selector'
import {CodeBlock} from '@astryxdesign/core/CodeBlock'
import {Link} from '@astryxdesign/core/Link'
import {clients, cursorInstallUrl} from './client-installation.mjs'

export default function SetupPrompt() {
  const [selected, setSelected] = useState('codex')
  const client = clients.find(({value}) => value === selected)!
  return <VStack gap={5} width="100%">
    <Selector label="Choose your app" value={selected} onChange={setSelected}
      options={clients.map(({value, label}) => ({value, label}))} width="100%" />
    <VStack key={selected} gap={4} aria-live="polite">
      <Text as="p">{client.description}</Text>
      {client.code && <CodeBlock code={client.code} width="100%" isWrapped title={selected === 'claude' ? 'Run in Claude Code' : 'Connection details'} />}
      {selected === 'cursor' && <Button label="Add to Cursor" href={cursorInstallUrl} variant="primary" />}
      {selected === 'codex' && <VStack gap={2}>
        <Button label="Install in Codex" href="codex://plugins/install/codex-plugin?marketplace=lunchmoney-mcp" variant="primary" />
        <Text type="supporting">Add the marketplace above first, then open this link in the Codex desktop app.</Text>
      </VStack>}
      <Text as="p" type="supporting">{client.next}</Text>
      {client.command && <CodeBlock code={client.command} width="100%" isWrapped title="Or install from your terminal" />}
      <Link href={'https://github.com/n3wth/lunchmoney-mcp/blob/main/' + client.guide}>Full setup instructions</Link>
    </VStack>
  </VStack>
}
