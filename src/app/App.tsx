import {Theme} from '@astryxdesign/core/theme'
import {AppShell} from '@astryxdesign/core/AppShell'
import {VStack, HStack} from '@astryxdesign/core/Stack'
import {Grid} from '@astryxdesign/core/Grid'
import {Section} from '@astryxdesign/core/Section'
import {Heading, Text} from '@astryxdesign/core/Text'
import {Link} from '@astryxdesign/core/Link'
import {neutralTheme} from '../../.cache/neutral'
import ShellTopNav from './shell-top-nav/page'
import AIChat from './ai-chat/page'
import SetupPrompt from './SetupPrompt'

const repo = 'https://github.com/n3wth/lunchmoney-mcp'

export default function App() {
  return <Theme theme={neutralTheme} mode="light">
    <AppShell height="auto" variant="surface" topNav={<ShellTopNav />}>
      <VStack hAlign="center" paddingInline={3} gap={6}>
        <VStack width="100%" maxWidth={1120} className="astryx-page-frame">
        <Theme theme={neutralTheme} mode="dark">
        <Section variant="transparent" width="100%" padding={6} className="astryx-hero-surface">
        <VStack as="section" id="intro" className="astryx-hero-content" width="100%" hAlign="center" gap={10} paddingBlockStart={6}>
          <VStack width="100%" maxWidth={840} gap={5} hAlign="center">
              <Heading level={1} type="display-1" textWrap="balance" justify="center">Your Lunch Money. Just ask.</Heading>
              <Text as="p" justify="center" textWrap="balance">Ask your AI about spending, budgets, and upcoming bills using your own <Link href="https://lunchmoney.app/?refer=94dziuj5" rel="sponsored" type="inherit" color="inherit" hasUnderline>Lunch Money</Link> data.</Text>
          </VStack>
          <VStack as="section" id="conversation" width="100%" maxWidth={840}>
            <VStack paddingBlock={4}>
            <AIChat />
            </VStack>
          </VStack>
        </VStack>
        </Section>
        </Theme>
        </VStack>
        <Text type="supporting" color="secondary" justify="center">Unofficial, read-only plugin. Not affiliated with or endorsed by Lunch Money.</Text>

        <VStack width="100%" maxWidth={1120} className="astryx-page-frame">
          <VStack hAlign="center" width="100%">
          <VStack as="section" id="connect" width="100%" maxWidth={650} gap={10} paddingBlock={10}>
            <VStack hAlign="center" paddingBlockStart={10}>
              <VStack gap={5} maxWidth={650}>
                <Heading level={2} type="display-2" justify="center" textWrap="balance">Get connected.</Heading>
              </VStack>
            </VStack>
            <SetupPrompt />
            <Grid columns={{minWidth: 240, max: 2, repeat: 'fit'}} gap={10}>
              <VStack gap={4}>
                <Text type="supporting">Step 1</Text><Heading level={3}>Sign in</Heading>
                <Text as="p" color="secondary" textWrap="balance">After installing, sign in when asked. The sign-in at auth.n3wth.com is for this plugin, separate from your Lunch Money login.</Text>
              </VStack>
              <VStack gap={4}>
                <Text type="supporting">Step 2</Text><Heading level={3}>Link Lunch Money</Heading>
                <Text as="p" color="secondary" textWrap="balance">Ask your AI to connect Lunch Money, then open the link it gives you.</Text>
              </VStack>
              <VStack gap={4}>
                <Text type="supporting">Step 3</Text><Heading level={3}>Add your API token</Heading>
                <Text as="p" color="secondary"><Link href="https://my.lunchmoney.app/developers" target="_blank" rel="noopener noreferrer" type="inherit">Request a new access token</Link> in Lunch Money, then paste it into the connection page. Never paste it in chat.</Text>
              </VStack>
              <VStack gap={4}>
                <Text type="supporting">Step 4</Text><Heading level={3}>Start a conversation</Heading>
                <Text as="p" color="secondary" textWrap="balance">Once connected, try asking something like “How much did I spend this month?”</Text>
              </VStack>
            </Grid>
          </VStack>

          </VStack>

          <Section variant="transparent" padding={0}>
          <VStack as="section" id="privacy" className="astryx-privacy-surface" gap={10} padding={8} paddingBlock={10}>
              <VStack gap={5} hAlign="center">
                <Heading level={2} type="display-2" justify="center" textWrap="balance">Stay in control.</Heading>
              </VStack>
              <Grid columns={{minWidth: 240, max: 2, repeat: 'fit'}} gap={10}>
                <VStack gap={3}>
                  <Heading level={3}>Nothing gets changed</Heading>
                  <Text as="p" color="secondary" textWrap="pretty">Your AI can read your finances, but can’t change records or move money.</Text>
                </VStack>
                <VStack gap={3}>
                  <Heading level={3}>Your AI receives records</Heading>
                  <Text as="p" color="secondary">Retrieved records are sent to your AI app. How it stores and uses them depends on your AI provider’s policies and settings.</Text>
                </VStack>
                <VStack gap={3}>
                  <Heading level={3}>No financial history stored</Heading>
                  <Text as="p" color="secondary">This connection looks up your records when you ask. It doesn’t keep a copy of the financial details it returns.</Text>
                </VStack>
                <VStack gap={3}>
                  <Heading level={3}>You can stop access</Heading>
                  <Text as="p" color="secondary" textWrap="pretty">Revoke your token in Lunch Money to stop access. Ask your AI to disconnect to delete the saved connection.</Text>
                </VStack>
              </Grid>
          </VStack>
          </Section>

          <VStack as="footer" width="100%" gap={4} paddingBlock={8}>
            <HStack width="100%" gap={4} wrap="wrap" hAlign="between" vAlign="start">
              <Link href="https://lunchmoney.app/?refer=94dziuj5" rel="sponsored" label="Powered by Lunch Money (referral link)">
                <img src="/powered-by-lunch-money.png" width="209" height="60" alt="Powered by Lunch Money" loading="lazy" />
              </Link>
            <VStack gap={3} hAlign="end">
              <Text type="supporting" justify="end">Unofficial integration by <Link href="https://n3wth.com" type="inherit" color="inherit">n3wth</Link>. Not affiliated with or endorsed by Lunch Money.</Text>
            <HStack gap={4} vAlign="center">
              <Link href={repo} type="supporting" color="secondary">GitHub</Link>
              <Link href="/terms" type="supporting" color="secondary">Terms</Link>
              <Link href="/privacy" type="supporting" color="secondary">Privacy</Link>
            </HStack>
            </VStack>
            </HStack>
          </VStack>
        </VStack>
      </VStack>
    </AppShell>
  </Theme>
}
