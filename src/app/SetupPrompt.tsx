import {useState} from 'react'
import {VStack} from '@astryxdesign/core/Stack'
import {Text} from '@astryxdesign/core/Text'
import {Button} from '@astryxdesign/core/Button'

const prompt = 'Connect Lunch Money using https://mcp.lunchmoney.sh/mcp (remote MCP with OAuth). Set it up if you can, or guide me through this app’s setup. If unsupported, tell me. Then help me sign in and link Lunch Money. I’ll enter my API token on the connection page, not in chat.'

export default function SetupPrompt() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
  }
  return <VStack gap={3} hAlign="center">
    <Button label={status === 'copied' ? 'Copied' : 'Copy setup prompt'} variant="secondary" size="sm" onClick={copy} />
    {status === 'error' && <Text type="supporting" aria-live="polite" justify="center">Copy unavailable. Select the prompt below.</Text>}
    {status === 'error' && <Text as="p">{prompt}</Text>}
  </VStack>
}
