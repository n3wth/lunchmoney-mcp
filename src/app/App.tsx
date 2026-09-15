import {Theme} from '@astryxdesign/core/theme'
import {AppShell} from '@astryxdesign/core/AppShell'
import {VStack, HStack} from '@astryxdesign/core/Stack'
import {Grid} from '@astryxdesign/core/Grid'
import {Section} from '@astryxdesign/core/Section'
import {Heading, Text} from '@astryxdesign/core/Text'
import {Button} from '@astryxdesign/core/Button'
import {Link} from '@astryxdesign/core/Link'
import {neutralTheme} from '../../.cache/neutral'
import ShellTopNav from './shell-top-nav/page'
import AIChat from './ai-chat/page'

const repo = 'https://github.com/n3wth/lunchmoney-mcp'
export default function App() {
  return <Theme theme={neutralTheme} mode="dark">
    <AppShell height="auto" variant="surface" topNav={<ShellTopNav />}>
    <VStack minHeight="100vh" hAlign="center">
      <VStack width="100%" maxWidth={1160} paddingInline={5}>
        <VStack gap={10} paddingBlock={10}>
          <Grid columns={{minWidth: 300, max: 2, repeat: 'fit'}} gap={10} align="center">
            <VStack gap={6} paddingBlock={10}>
              <Heading level={1} type="display-2">Ask your money<br />a question.</Heading>
              <Text size="lg">Connect <Link href="https://lunchmoney.app">Lunch Money</Link> to your AI agent. Get answers about your spending, upcoming bills, and account balances in plain language.</Text>
              <HStack><Button label="Connect Lunch Money" href="#connect" variant="primary" size="lg" /></HStack>
              <Text color="secondary">Unofficial, open source, and read-only. By <Link href="https://n3wth.com">n3wth</Link>.</Text>
            </VStack>
            <AIChat />
          </Grid>
          <Section variant="transparent" padding={0} dividers={['top']}>
            <VStack gap={6} paddingBlock={10} as="section" id="connect">
              <Heading level={2}>Get started</Heading>
              <Grid columns={{minWidth: 240, repeat: 'fit'}} gap={6}>
                <VStack gap={3}><Heading level={3}>1. Add to your AI tool</Heading><Text>Follow the <Link href={repo + '#client-specific-installation'}>installation instructions</Link>, then sign in at auth.n3wth.com when prompted.</Text></VStack>
                <VStack gap={3}><Heading level={3}>2. Link Lunch Money</Heading><Text>Ask your agent to connect Lunch Money. Open its browser link and enter your API token there, never in chat.</Text></VStack>
                <VStack gap={3}><Heading level={3}>3. Ask a question</Heading><Text>Start with “List my accounts.” Your agent reads the requested records from Lunch Money to answer.</Text></VStack>
              </Grid>
              <VStack gap={3}><Heading level={3}>Manual MCP setup</Heading><Text>Use this remote server URL, then complete the sign-in prompt.</Text><Text>https://mcp.lunchmoney.sh/mcp</Text><Link href={repo + '/blob/main/docs/user-guide.md'}>Full setup guide</Link></VStack>
            </VStack>
          </Section>
          <Section variant="transparent" padding={0} dividers={['top']}>
            <VStack gap={6} paddingBlock={10} as="section" id="privacy">
              <Heading level={2}>Get answers, keep control</Heading>
              <Grid columns={{minWidth: 240, repeat: 'fit'}} gap={6}>
                <VStack gap={3}><Heading level={3}>Your finances stay unchanged</Heading><Text>The connector can read your records, but cannot edit transactions, change budgets, or move money.</Text></VStack>
                <VStack gap={3}><Heading level={3}>Results go to your agent</Heading><Text>The connector does not save financial responses. Your AI client and its model provider receive the results; their privacy and retention settings apply.</Text></VStack>
                <VStack gap={3}><Heading level={3}>Disconnect when you want</Heading><Text>Run lunchmoney_disconnect and retry if deletion fails. Revoke the original token in Lunch Money separately. Uninstalling a plugin does neither.</Text></VStack>
              </Grid>
            </VStack>
          </Section>
          <VStack gap={4}><Heading level={2}>How sign-in and token storage work</Heading>
            <Text><Link href="https://auth0.com">Auth0</Link> handles sign-in at <Link href="https://auth.n3wth.com">auth.n3wth.com</Link>, separately from your Lunch Money login. <Link href="https://nango.dev">Nango</Link> stores your API token.</Text>
            <Text><Link href="https://cloudflare.com">Cloudflare</Link> runs the connector and keeps identity and connection records. <Link href="https://vercel.com">Vercel</Link> hosts this website.</Text>
            <Text>The connector enforces financial reads only, even if your token has broader permissions.</Text>
          </VStack>
        </VStack>
        <HStack as="footer" gap={5} wrap="wrap" paddingBlock={8}><Link href="/">lunchmoney.sh</Link><Text>By <Link href="https://n3wth.com">n3wth</Link></Text><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></HStack>
      </VStack>
    </VStack>
    </AppShell>
  </Theme>
}
