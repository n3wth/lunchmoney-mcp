import {useState} from 'react'
import {Theme} from '@astryxdesign/core/theme'
import {AppShell} from '@astryxdesign/core/AppShell'
import {VStack} from '@astryxdesign/core/Stack'
import {Heading, Text} from '@astryxdesign/core/Text'
import {Link} from '@astryxdesign/core/Link'
import {Button} from '@astryxdesign/core/Button'
import {neutralTheme} from '../../.cache/neutral'
import ShellTopNav from './shell-top-nav/page'
import SiteFooter from './SiteFooter'
export default function LegalPage({path}: {path: string}) {
  const [status, setStatus] = useState('')
  const disableAnalytics = () => {
    try {
      localStorage.setItem('lunchmoney-analytics-consent', JSON.stringify({enabled: false, expires: Date.now() + 180 * 86400000}))
      setStatus('Usage counts disabled in this browser.')
    } catch { setStatus('Your browser could not save the preference. Enable Do Not Track or Global Privacy Control to prevent collection.') }
  }
  return <Theme theme={neutralTheme} mode="light">
    <AppShell height="auto" variant="surface" topNav={<ShellTopNav />}>
      <VStack hAlign="center" paddingInline={3}>
        <VStack width="100%" maxWidth={1120} className="astryx-page-frame" hAlign="center">
          <VStack as="main" id="main" width="100%" maxWidth={720} gap={8} className="astryx-page-section">
      {path === "/terms" && <>

    <Heading level={1} type="display-2">Terms of service</Heading>
    <Text as="p" type="supporting">Last updated September 16, 2026</Text>
    <Text as="p" color="secondary">These terms cover lunchmoney.sh and the hosted Lunch Money for Agents connector, operated by Oliver Newth. By using the service, you agree to these terms. This is an independent, unofficial project, not affiliated with, endorsed by, or sponsored by Lunch Money.</Text>
    <VStack as="section" gap={4}><Heading level={2}>The service</Heading>
      <Text as="p" color="secondary">The connector is a beta service that lets supported MCP clients request financial information from Lunch Money. The service enforces read-only access to financial data. Availability and compatibility may change, and the service may be changed or discontinued.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Your account and credentials</Heading>
      <Text as="p" color="secondary">Connect only your own account or an account and data you are authorized to access. Use the service lawfully and do not try to bypass access controls, access another user's connection, or disrupt the service.</Text>
      <Text as="p" color="secondary">Keep your credentials private. Enter your Lunch Money token only in the browser connection flow provided by Nango, never in chat. The token may have broader permissions than this connector uses. You are responsible for reviewing requests from your AI client and protecting access to your account.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Financial results and AI answers</Heading>
      <Text as="p" color="secondary">Results and AI-generated answers may be incomplete, delayed, or incorrect. Review them against your Lunch Money account before making decisions. The service does not guarantee accuracy or provide personalized financial advice.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Other providers and privacy</Heading>
      <Text as="p" color="secondary">The service depends on Lunch Money, Auth0, Nango, Cloudflare, Vercel, and your selected AI client and model provider. Your use of those services is subject to their applicable terms and policies. Requested financial results are returned to your client and may be processed by its model provider.</Text>
      <Text as="p" color="secondary">The <Link hasUnderline href="/privacy">privacy notice</Link> explains how the connector handles credentials, account records, results, and operational logs.</Text>
    </VStack>
    <VStack as="section" gap={4} id="analytics"><Heading level={2}>Usage statistics</Heading>
      <Text as="p" color="secondary">Basic usage counts are enabled by default. PostHog US Cloud receives landing-page view, Connect-click and successful prompt-copy events to help improve this website. No financial data, chat content, credentials, session recordings, or persistent visitor identifiers are included. We do not use analytics cookies. Global Privacy Control and Do Not Track signals prevent collection. See the <Link hasUnderline href="/privacy">privacy notice</Link> for network processing and retention details.</Text>
      <Text as="p" color="secondary">You can disable these counts below. This preference is stored on this browser for 180 days and does not affect the service.</Text>
      <Button label="Disable usage counts" width="fit-content" onClick={disableAnalytics} />
      <Text as="p" role="status">{status}</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Stopping use</Heading>
      <Text as="p" color="secondary">You may stop using the service at any time. Run <code>lunchmoney_disconnect</code> to delete the Nango connection. The connector marks the connection deleted after success; if deletion fails, access may remain active, so retry and confirm success. Revoke the token separately in Lunch Money. Uninstalling a plugin does not perform these steps. The privacy notice describes records retained after disconnecting.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Source code and changes</Heading>
      <Text as="p" color="secondary">The repository's source code is available under its MIT license. That license governs the code; these terms govern use of this hosted service. Updated service terms will be published here with a revised date.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Contact</Heading>
      <Text as="p" color="secondary">For support or questions about these terms, contact <Link hasUnderline href="mailto:oliver@newth.ai">oliver@newth.ai</Link>. Do not send API tokens or financial records.</Text>
    </VStack>
  
      </>}
      {path === "/security" && <>

    <Heading level={1} type="display-2">Financial data privacy and security</Heading>
    <Text as="p" type="supporting">Reviewed September 16, 2026</Text>
    <Text as="p" color="secondary">Using an AI financial assistant means sharing the records it needs to answer your question. This unofficial Lunch Money connector limits financial access to reads, but those records still reach your AI app. This page explains the data flow and your controls. Read the <Link hasUnderline href="/privacy">privacy notice</Link> and <Link hasUnderline href="/terms">terms of service</Link> for the full notices.</Text>
    <VStack as="section" gap={4} id="data-flow"><Heading level={2}>Where does my financial data go?</Heading>
      <Text as="p" color="secondary"><strong>Request:</strong> your AI app sends a tool request to the hosted connector. The connector checks your sign-in and associated connection, retrieves the token from Nango, and requests the allowed records from Lunch Money.</Text>
      <Text as="p" color="secondary"><strong>Response:</strong> Lunch Money returns records to the connector. The adapter selects supported fields, then the connector returns the result to your AI app. Your app may pass those records to its model provider to generate an answer. This is a hosted service, not an entirely local workflow.</Text>
    </VStack>
    <VStack as="section" gap={4} id="token"><Heading level={2}>Where is my Lunch Money token stored?</Heading>
      <Text as="p" color="secondary">Enter your token only in Nango's browser connection flow, never in chat or an MCP configuration file. Nango stores the credential. The connector retrieves it into server memory to authenticate requests to Lunch Money; it does not store the token in its identity database or return it as a tool result.</Text>
      <Text as="p" color="secondary">Nango documents encryption of stored credentials in its <Link hasUnderline href="https://nango.dev/docs/guides/platform/security">security documentation</Link>. That is a provider-described control, not an independent audit of this deployment. This review does not verify provider dashboard settings, backup deletion, or retention periods.</Text>
    </VStack>
    <VStack as="section" gap={4} id="read-only"><Heading level={2}>What does read-only access protect?</Heading>
      <Text as="p" color="secondary">The connector exposes tools for reading accounts, transactions, categories, tags, recurring items, and budget summaries. Its adapter permits only GET requests to a fixed Lunch Money API origin and an allowlist of read endpoints. It cannot edit financial records or move money through these tools. Connection tools can still create or delete the saved connection.</Text>
      <Text as="p" color="secondary">This restriction belongs to the connector, not necessarily to your Lunch Money token. A token used elsewhere may have broader permissions. Read-only access does not stop sensitive records from being read, included in an AI answer, retained by a provider, or shared from your conversation. Review which tools and records you authorize your AI app to use.</Text>
    </VStack>
    <VStack as="section" gap={4} id="ai-client"><Heading level={2}>What can my AI app and model provider receive?</Heading>
      <Text as="p" color="secondary">Depending on the requested tool, results can include account names and balances; transaction dates, payees, amounts, currencies and category or tag identifiers; category and tag names; recurring items; and budget summaries. Transaction notes and undeclared fields are removed by the adapter, but the returned records remain sensitive and are not anonymous.</Text>
      <Text as="p" color="secondary">Your AI app decides how to use tool results and which conversation context to send to its model provider. The connector cannot enforce that provider's storage, training, sharing, or deletion settings. Check the policies and data controls for your specific app, account plan, and model before connecting. Disconnecting later does not recall records already returned.</Text>
    </VStack>
    <VStack as="section" gap={4} id="retention"><Heading level={2}>What does the connector retain?</Heading>
      <ul>
        <li><strong>Account and connection records:</strong> internal user ID, authentication issuer and subject, connection identifiers, status, environment, and timestamps are stored in Cloudflare D1 to associate your connection with your account.</li>
        <li><strong>Financial results:</strong> requested records pass through the connector to your AI app. The connector does not persist financial responses in its database. Your AI app and its model provider may retain those results in conversations under their own settings and policies.</li>
        <li><strong>Operational counts:</strong> allowlisted event labels, tool names, and HTTP status codes help measure reliability. Connector telemetry excludes user identifiers, tool arguments, tokens, connection links, request bodies, and financial results. Infrastructure providers may keep separate security and network logs.</li>
        <li><strong>Website usage:</strong> PostHog receives page-view, Connect-click, and successful setup-copy events with a fresh random identifier for each event. We do not send financial data, credentials, chat content, page URLs, referrers, or user identities in those events. The website uses no analytics cookies or session recording. PostHog still receives network information, including your IP address, when your browser connects.</li>
      </ul>
      <Text as="p" color="secondary">Website usage counts are enabled by default. You can <Link hasUnderline href="/terms#analytics">disable them</Link>; Global Privacy Control and Do Not Track also prevent collection. An explicit preference is stored locally for 180 days.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Services involved</Heading>
      <Text as="p" color="secondary">These providers handle different parts of the connection. Their policies explain their own processing and retention.</Text>
      <ul>
        <li><strong>Auth0 (Okta):</strong> account sign-in at auth.n3wth.com and authentication information. <Link hasUnderline href="https://www.okta.com/legal/privacy-policy/">Privacy policy</Link>.</li>
        <li><strong>Nango:</strong> browser connection setup and storage of your Lunch Money API token. <Link hasUnderline href="https://nango.dev/privacy-policy">Privacy policy</Link>.</li>
        <li><strong>Cloudflare:</strong> connector execution, identity and connection records in D1, and operational telemetry. <Link hasUnderline href="https://www.cloudflare.com/privacypolicy/">Privacy policy</Link>.</li>
        <li><strong>Vercel:</strong> website hosting and routing requests to the connector. <Link hasUnderline href="https://vercel.com/legal/privacy-notice">Privacy notice</Link>.</li>
        <li><strong>PostHog US Cloud:</strong> website usage events described above. <Link hasUnderline href="https://posthog.com/privacy">Privacy policy</Link>.</li>
        <li><strong>Lunch Money:</strong> your original financial records and API requests authenticated with your token. <Link hasUnderline href="https://lunchmoney.app/privacy">Privacy policy</Link>.</li>
      </ul>
      <Text as="p" color="secondary">Your chosen AI app also receives the requested financial results. Review its privacy policy and data controls before connecting: <Link hasUnderline href="https://openai.com/policies/privacy-policy/">OpenAI (ChatGPT and Codex)</Link>, <Link hasUnderline href="https://www.anthropic.com/legal/privacy">Anthropic (Claude)</Link>, <Link hasUnderline href="https://cursor.com/privacy">Cursor</Link>, or <Link hasUnderline href="https://x.ai/legal/privacy-policy">xAI (Grok)</Link>. Listing a provider here does not mean its integration is available or verified.</Text>
    </VStack>
    <VStack as="section" gap={4} id="disconnect"><Heading level={2}>How is disconnecting different from revoking my token?</Heading>
      <Text as="p" color="secondary"><strong>Disconnect the saved connection:</strong> ask your AI to run <code>lunchmoney_disconnect</code>. The server requests deletion of the Nango connection, then marks its connection record deleted after success. If deletion fails, access may remain active; retry and confirm success.</Text>
      <Text as="p" color="secondary"><strong>Revoke the original token:</strong> open <Link hasUnderline href="https://my.lunchmoney.app/developers">Lunch Money's Developers page</Link> and revoke that token. This invalidates the credential for future API requests, including uses outside this connector. Lunch Money describes this control in its <Link hasUnderline href="https://lunchmoney.dev/getting-started">API getting-started guide</Link>. Disconnecting does not revoke the token, and uninstalling the plugin performs neither action.</Text>
      <Text as="p" color="secondary">Identity and connection lifecycle records remain after disconnect to preserve ownership and prevent replay or reconnection races. They do not currently have an automatic expiry. Provider logs and backups follow their respective retention settings. This integration does not configure automatic deletion of PostHog events.</Text>
      <Text as="p" color="secondary">Disconnecting does not delete your AI chat history. Manage that through your AI provider. For removal of retained connector records, contact <Link hasUnderline href="mailto:oliver@newth.ai">oliver@newth.ai</Link>.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Report a security issue</Heading>
      <Text as="p" color="secondary">Email <Link hasUnderline href="mailto:oliver@newth.ai">oliver@newth.ai</Link> with a description and steps to reproduce. Do not include API tokens or financial records. You can also inspect the <Link hasUnderline href="https://github.com/n3wth/lunchmoney-mcp">source code</Link>.</Text>
    </VStack>
  
      </>}
      {path === "/privacy" && <>

    <Heading level={1} type="display-2">Privacy</Heading>
    <Text as="p" type="supporting">Last updated September 16, 2026</Text>
    <Text as="p" color="secondary">Lunch Money for Agents is operated by Oliver Newth as an independent project. It is not affiliated with, endorsed by, or sponsored by Lunch Money. This notice covers lunchmoney.sh and its hosted MCP connector.</Text>

    <VStack as="section" gap={4}><Heading level={2}>Information processed</Heading>
      <Text as="p" color="secondary">When you sign in through Auth0 at auth.n3wth.com, the connector uses your verified account identifier to associate your connection with your account. It stores an internal user ID, the authentication issuer and subject, connection identifiers, connection status, environment, and timestamps in Cloudflare D1.</Text>
      <Text as="p" color="secondary">When you request a financial tool, the connector retrieves the requested information from Lunch Money, such as accounts, transactions, categories, tags, recurring items, or budget summaries. It processes those results to answer your request and does not persist financial responses in its database.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Your Lunch Money token</Heading>
      <Text as="p" color="secondary">You enter your token in Nango's browser-based connection flow, not in chat. Nango stores the token. The connector retrieves it temporarily to make allowed requests to the Lunch Money API. The connector enforces financial reads only, even if the token itself has broader permissions.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Who receives information</Heading>
      <Text as="p" color="secondary">Auth0 handles authentication. Nango handles credential storage and connection setup. Cloudflare runs the connector and stores identity and connection records. Vercel hosts the website and routes requests to the connector. Lunch Money processes requests made to its API.</Text>
      <Text as="p" color="secondary">Requested financial results are returned to the MCP client you choose, and may be sent to that client's model provider. Your client's privacy settings and provider policies govern their handling and retention of those results. This connector does not control or delete your chat history.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Website and operational logs</Heading>
      <Text as="p" color="secondary">The website's example conversations use fictional data and run locally. Basic website usage counts are enabled by default: we send landing-page view, Connect-click and successful setup-prompt-copy events to PostHog US Cloud to understand usage and improve the website. Each event has a new random identifier; we do not use it to link visits or create a person profile.</Text>
      <Text as="p" color="secondary">These events contain only the event label, a fixed site label, and privacy-control fields. We do not send financial data, credentials, chat content, page URLs, query strings, referrers, or user identities. We do not use session recording, automatic interaction capture, advertising tracking or analytics cookies. We replace the analytics IP property with a placeholder and disable geolocation enrichment. PostHog still receives network information such as your IP address when your browser connects to its servers.</Text>
      <Text as="p" color="secondary">We use these statistical counts for our legitimate interest in improving the website, where applicable law permits. You can <Link hasUnderline href="/terms#analytics">disable usage counts</Link> at any time; this stops future events. Only an explicit preference is saved in local storage for 180 days. Global Privacy Control and Do Not Track signals prevent collection. Opting out does not affect the service. Authentication providers may use cookies on their login pages.</Text>
      <Text as="p" color="secondary">Connector telemetry in Cloudflare contains allowlisted event labels, requested tool names and HTTP status codes, so we can measure request volume and reliability. Tool counts represent authenticated requests admitted by rate limits, not necessarily successful results. It includes no user identifiers, tool arguments, tokens, connection links, request bodies, or financial results. Hosting and authentication providers may retain their own operational or security logs, including network information such as IP addresses. These operational counts are separate from optional website analytics and are not sent to PostHog.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Disconnecting and retention</Heading>
      <Text as="p" color="secondary">Call <code>lunchmoney_disconnect</code> to delete the Nango connection. The connector marks the connection deleted after success; if deletion fails, access may remain active, so retry and confirm success. Disconnecting does not revoke the original Lunch Money token: revoke it in Lunch Money to prevent its further use elsewhere.</Text>
      <Text as="p" color="secondary">Identity records and connection lifecycle records remain after disconnect to preserve ownership and prevent replay or reconnection races. The service does not currently apply an automatic expiry period to these records. Infrastructure backups and provider logs follow the respective providers' retention settings. Uninstalling a plugin alone does not disconnect the service.</Text>
      <Text as="p" color="secondary">For a request about your information or removal of retained connector records, contact <Link hasUnderline href="mailto:oliver@newth.ai">oliver@newth.ai</Link>. Do not include API tokens or financial records in your email.</Text>
      <Text as="p" color="secondary">Website analytics are hosted by PostHog in the United States. This integration does not configure an automatic event-deletion period; events remain subject to the project's retention settings until deleted. Because event identifiers are not retained in your browser or linked to your identity, we may be unable to locate individual analytics events in response to a request. See <Link hasUnderline href="https://posthog.com/privacy">PostHog's privacy notice</Link> for its handling of information.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Your privacy rights</Heading>
      <Text as="p" color="secondary">Depending on your location, you may have rights to access, correct, delete, restrict or object to processing of your personal information, request portability, withdraw consent, and complain to your local data-protection authority. Contact <Link hasUnderline href="mailto:oliver@newth.ai">oliver@newth.ai</Link> to exercise these rights. We use operational records to provide and secure the connector, relying on our legitimate interests where that legal basis applies. We do not sell personal information or share it for cross-context behavioral advertising.</Text>
    </VStack>
    <VStack as="section" gap={4}><Heading level={2}>Questions and changes</Heading>
      <Text as="p" color="secondary">Contact <Link hasUnderline href="mailto:oliver@newth.ai">oliver@newth.ai</Link> with privacy questions. Changes to the connector's data handling will be reflected on this page with an updated date.</Text>
    </VStack>
  
      </>}
          </VStack>
          <SiteFooter />
        </VStack>
      </VStack>
    </AppShell>
  </Theme>
}
