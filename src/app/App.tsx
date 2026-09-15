import {Theme} from '@astryxdesign/core/theme'
import {AppShell} from '@astryxdesign/core/AppShell'
import {VStack, HStack} from '@astryxdesign/core/Stack'
import {Grid} from '@astryxdesign/core/Grid'
import {Section} from '@astryxdesign/core/Section'
import {Heading, Text} from '@astryxdesign/core/Text'
import {Button} from '@astryxdesign/core/Button'
import {Link} from '@astryxdesign/core/Link'
import {Collapsible} from '@astryxdesign/core/Collapsible'
import {neutralTheme} from '../../.cache/neutral'
import ShellTopNav from './shell-top-nav/page'
import AIChat from './ai-chat/page'

const repo = 'https://github.com/n3wth/lunchmoney-mcp'

export default function App() {
  return <Theme theme={neutralTheme} mode="light">
    <AppShell height="auto" variant="surface" topNav={<ShellTopNav />}>
      <VStack hAlign="center">
        <VStack as="section" id="intro" width="100%" hAlign="center" paddingInline={6} paddingBlock={10}>
          <VStack maxWidth={960} width="100%" gap={6} hAlign="center" paddingBlock={6}>
            <Heading level={1} type="display-1" justify="center" textWrap="balance">Lunch Money.<br />Beyond the numbers.</Heading>
            <VStack maxWidth={560}>
              <Text as="p" size="xl" color="secondary" justify="center" textWrap="balance">Ask your AI about your spending.<br />Get an answer you can work with.</Text>
            </VStack>
            <HStack gap={4} wrap="wrap" hAlign="center" vAlign="center">
              <Button label="Connect Lunch Money" href="#connect" variant="primary" size="lg" />
            </HStack>
            <Text type="supporting" justify="center">Independently built for Lunch Money. Your AI can look, but can’t make changes.</Text>
          </VStack>
          <VStack as="section" id="conversation" width="100%" maxWidth={760} paddingBlockStart={10}>
            <AIChat />
          </VStack>
        </VStack>

        <VStack width="100%" maxWidth={1120} paddingInline={6}>
          <VStack as="section" id="connect" gap={10} paddingBlock={10}>
            <VStack hAlign="center" paddingBlockStart={10}>
              <VStack gap={5} maxWidth={650}>
                <Heading level={2} type="display-2" justify="center" textWrap="balance">Less digging.<br />More understanding.</Heading>
                <Text as="p" size="lg" color="secondary" justify="center" textWrap="balance">Connect the Lunch Money app to your AI tool through Model Context Protocol. Then ask what you want to know.</Text>
              </VStack>
            </VStack>
            <Grid columns={{minWidth: 240, max: 3, repeat: 'fit'}} gap={10}>
              <VStack gap={4}>
                <Text type="supporting">Step 1</Text><Heading level={3}>Add the connector</Heading>
                <Text as="p" color="secondary">Follow the <Link href={repo + '#client-specific-installation'}>instructions for your AI tool</Link>, then sign in when prompted.</Text>
                <Text as="p" type="supporting"><Link href="https://auth0.com" type="inherit" color="inherit">Auth0</Link> handles sign-in at <Link href="https://auth.n3wth.com" type="inherit" color="inherit">auth.n3wth.com</Link>, separately from your Lunch Money login.</Text>
              </VStack>
              <VStack gap={4}>
                <Text type="supporting">Step 2</Text><Heading level={3}>Link Lunch Money</Heading>
                <Text as="p" color="secondary">Ask your agent to connect Lunch Money. Enter your API token in the browser link it gives you, never in chat.</Text>
                <Text as="p" type="supporting">Your API token is stored by <Link href="https://nango.dev" type="inherit" color="inherit">Nango</Link>.</Text>
              </VStack>
              <VStack gap={4}>
                <Text type="supporting">Step 3</Text><Heading level={3}>Start a conversation</Heading>
                <Text as="p" color="secondary">Try “List my accounts.” Your agent reads the requested records from Lunch Money to answer.</Text>
              </VStack>
            </Grid>
            <Section variant="transparent" padding={0} dividers={['top', 'bottom']}>
              <VStack paddingBlock={5}>
                <Collapsible defaultIsOpen={false} trigger="Connecting manually?">
                  <VStack gap={4} paddingBlock={5}>
                    <Text as="p" color="secondary">Add this remote MCP server URL, then complete the sign-in prompt.</Text>
                    <Text type="code" wordBreak="break-all">https://mcp.lunchmoney.sh/mcp</Text>
                    <Link href={repo + '/blob/main/docs/user-guide.md'}>Read the setup guide</Link>
                  </VStack>
                </Collapsible>
              </VStack>
            </Section>
          </VStack>

          <VStack as="section" id="privacy" gap={10} paddingBlock={10}>
              <VStack gap={5} hAlign="center">
                <Heading level={2} type="display-2" justify="center" textWrap="balance">A little more clarity.<br />The same control.</Heading>
                <Text as="p" size="lg" color="secondary" justify="center">Built to read your finances, never change them.</Text>
              </VStack>
              <Grid columns={{minWidth: 240, max: 3, repeat: 'fit'}} gap={10}>
                <VStack gap={3}>
                  <Heading level={3}>Nothing gets changed</Heading>
                  <Text as="p" color="secondary">Your AI can look up your spending, budgets, and balances. It can’t edit anything in Lunch Money or move your money.</Text>
                </VStack>
                <VStack gap={3}>
                  <Heading level={3}>Your AI sees what it needs</Heading>
                  <Text as="p" color="secondary">The details needed to answer your question go to your AI app. This connection doesn’t save those details. Your AI app’s privacy settings still apply.</Text>
                </VStack>
                <VStack gap={3}>
                  <Heading level={3}>You can stop access</Heading>
                  <Text as="p" color="secondary">Revoke the API token in your Lunch Money settings to stop access. Ask your AI to disconnect Lunch Money to remove the saved connection, too.</Text>
                </VStack>
              </Grid>
          </VStack>

          <Section variant="transparent" padding={0} dividers={['top']}>
            <VStack gap={6} hAlign="center" paddingBlock={10}>
              <Heading level={2} type="display-2" justify="center">Where did your money go?</Heading>
              <Button label="Connect Lunch Money" href="#connect" variant="primary" size="lg" />
            </VStack>
          </Section>
          <HStack as="footer" gap={6} wrap="wrap" hAlign="between" paddingBlock={8}>
            <Text type="supporting">Lunch Money for Agents, by <Link href="https://n3wth.com" type="inherit" color="inherit">n3wth</Link>.</Text>
            <HStack gap={5}>
              <Link href={repo} type="supporting" color="secondary">GitHub</Link>
              <Link href="/terms" type="supporting" color="secondary">Terms</Link>
              <Link href="/privacy" type="supporting" color="secondary">Privacy</Link>
            </HStack>
          </HStack>
        </VStack>
      </VStack>
    </AppShell>
  </Theme>
}
