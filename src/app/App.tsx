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
import SetupPrompt from './SetupPrompt'
import HeroShader from './HeroShader'
import AnalyticsSettings from './AnalyticsSettings'

const repo = 'https://github.com/n3wth/lunchmoney-mcp'

export default function App() {
  return <Theme theme={neutralTheme} mode="light">
    <AppShell height="auto" variant="surface" topNav={<ShellTopNav />}>
      <VStack hAlign="center" paddingInline={3} gap={6}>
        <Theme theme={neutralTheme} mode="dark">
        <Section variant="muted" width="100%" padding={6} className="astryx-hero-surface">
        <HeroShader />
        <VStack as="section" id="intro" className="astryx-hero-content" width="100%" hAlign="center" gap={10} paddingBlockStart={10}>
          <VStack width="100%" maxWidth={840} gap={6} hAlign="center">
              <Heading level={1} type="display-1" textWrap="balance" justify="center">Ask more of your money.</Heading>
              <Button label="Connect Lunch Money" href="#connect" variant="primary" size="lg" />
          </VStack>
          <VStack as="section" id="conversation" width="100%" maxWidth={840}>
            <VStack padding={6}>
            <AIChat />
            </VStack>
          </VStack>
        </VStack>
        </Section>
        </Theme>
        <Text type="supporting" color="secondary" justify="center">Independently developed.</Text>

        <VStack width="100%" maxWidth={1120} paddingInline={6}>
          <VStack as="section" id="connect" gap={10} paddingBlock={10}>
            <VStack hAlign="center" paddingBlockStart={10}>
              <VStack gap={5} maxWidth={650}>
                <Heading level={2} type="display-2" justify="center" textWrap="balance">Get connected.</Heading>
              </VStack>
            </VStack>
            <SetupPrompt />
            <Grid columns={{minWidth: 240, max: 2, repeat: 'fit'}} gap={10}>
              <VStack gap={4}>
                <Text type="supporting">Step 1</Text><Heading level={3}>Add the connector</Heading>
                <Text as="p" color="secondary" textWrap="balance">Follow the setup guide for your AI tool, then sign in when prompted.</Text>
                <Link href={repo + '#client-specific-installation'}>Setup guide</Link>
              </VStack>
              <VStack gap={4}>
                <Text type="supporting">Step 2</Text><Heading level={3}>Link Lunch Money</Heading>
                <Text as="p" color="secondary" textWrap="balance">Ask your AI to connect Lunch Money, then open the link it gives you.</Text>
              </VStack>
              <VStack gap={4}>
                <Text type="supporting">Step 3</Text><Heading level={3}>Add your API token</Heading>
                <Text as="p" color="secondary" textWrap="balance">Enter your Lunch Money API token on the connection page, never in chat.</Text>
              </VStack>
              <VStack gap={4}>
                <Text type="supporting">Step 4</Text><Heading level={3}>Start a conversation</Heading>
                <Text as="p" color="secondary" textWrap="balance">Try “List my accounts.” Your agent reads the requested records from Lunch Money to answer.</Text>
              </VStack>
            </Grid>
            <Section variant="transparent" padding={0} dividers={['top', 'bottom']}>
              <VStack paddingBlock={5}>
                <Collapsible defaultIsOpen={false} trigger="Connect manually">
                  <VStack gap={4} paddingBlock={5}>
                    <Text as="p" color="secondary">Add this remote MCP server URL, then complete the sign-in prompt.</Text>
                    <Text type="code" wordBreak="break-all">https://mcp.lunchmoney.sh/mcp</Text>
                    <Link href={repo + '/blob/main/docs/user-guide.md'}>Read the setup guide</Link>
                  </VStack>
                </Collapsible>
              </VStack>
            </Section>
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

          <Section variant="transparent" padding={0}>
            <VStack gap={6} hAlign="center" className="astryx-final-cta">
              <Heading level={2} type="display-2" justify="center">See what’s possible.</Heading>
              <Button label="Connect Lunch Money" href="#connect" variant="primary" size="lg" />
            </VStack>
          </Section>
          <HStack as="footer" gap={6} wrap="wrap" hAlign="between" paddingBlock={8}>
            <Text type="supporting">A creation from <Link href="https://n3wth.com" type="inherit" color="inherit">n3wth</Link></Text>
            <HStack gap={5}>
              <Link href={repo} type="supporting" color="secondary">GitHub</Link>
              <Link href="/terms" type="supporting" color="secondary">Terms</Link>
              <Link href="/privacy" type="supporting" color="secondary">Privacy</Link>
            </HStack>
          </HStack>
          <AnalyticsSettings />
        </VStack>
      </VStack>
    </AppShell>
  </Theme>
}
