import {Theme} from '@astryxdesign/core/theme'
import {AppShell} from '@astryxdesign/core/AppShell'
import {Breadcrumbs, BreadcrumbItem} from '@astryxdesign/core/Breadcrumbs'
import {Section} from '@astryxdesign/core/Section'
import {VStack} from '@astryxdesign/core/Stack'
import {Table, proportional} from '@astryxdesign/core/Table'
import {Heading, Text} from '@astryxdesign/core/Text'
import {Link} from '@astryxdesign/core/Link'
import {neutralTheme} from '../../.cache/neutral'
import ShellTopNav from './shell-top-nav/page'
import SiteFooter from './SiteFooter'

const recurringItems: Array<Record<string, string>> = [
  {
    payee: 'Northstar Video',
    amount: '14.99 USD',
    cadence: 'Month',
    anchor: 'Sep 12',
    status: 'Reviewed'
  },
  {
    payee: 'Harbor Fitness',
    amount: '42.00 USD',
    cadence: 'Month',
    anchor: 'Sep 18',
    status: 'Reviewed'
  },
  {
    payee: 'Cloud Keep',
    amount: '71.88 USD',
    cadence: 'Year',
    anchor: 'Oct 19',
    status: 'Reviewed'
  }
]

const columns = [
  {key: 'payee', header: 'Fictional payee', width: proportional(2)},
  {key: 'amount', header: 'Expected amount', width: proportional(1)},
  {key: 'cadence', header: 'Cadence', width: proportional(1)},
  {key: 'anchor', header: 'Schedule anchor', width: proportional(1)},
  {key: 'status', header: 'Status', width: proportional(1)}
]

export default function RecurringBillsGuide() {
  return <Theme theme={neutralTheme} mode="light">
    <AppShell height="auto" variant="surface" topNav={<ShellTopNav />}>
      <VStack hAlign="center" paddingInline={3} gap={6}>
        <VStack as="main" id="main-content" width="100%" maxWidth={840} className="astryx-page-frame" gap={10}>
          <Breadcrumbs variant="supporting" label="Guide breadcrumb">
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Recurring bills guide</BreadcrumbItem>
          </Breadcrumbs>

          <VStack gap={5}>
            <Text type="supporting">Guide</Text>
            <Heading level={1} type="display-2" textWrap="balance">Find recurring expenses and audit subscriptions</Heading>
            <Text as="p" type="large" color="secondary" textWrap="pretty">Use the read-only Lunch Money connector to review expected bills, distinguish saved recurring items from suggestions, and prepare a provider-by-provider cancellation checklist.</Text>
            <Text as="p" type="supporting">Examples on this page are fictional. Lunch Money for Agents is an unofficial integration and is not affiliated with or endorsed by Lunch Money.</Text>
          </VStack>

          <Section variant="muted" padding={6}>
            <VStack gap={4}>
              <Heading level={2}>Before you start</Heading>
              <Text as="p" color="secondary">Connect through the <Link hasUnderline href="/#connect">setup flow</Link>, then ask for a narrow date range. Enter your Lunch Money API token only on the browser connection page, never in chat or client configuration.</Text>
              <Text as="p" color="secondary">The connector can read recurring items. It cannot create or edit them, cancel a subscription, change a payment, or move money. Read the <Link hasUnderline href="/security">security and data explanation</Link> before sending financial records to an AI client.</Text>
            </VStack>
          </Section>

          <VStack as="section" gap={5}>
            <Heading level={2}>1. Ask for recorded recurring items</Heading>
            <Text as="p" color="secondary">Start with items already returned as recurring records. Both dates are required when you provide a range. This prompt maps to <Text type="code">lunchmoney_list_recurring_items</Text> with <Text type="code">include_suggested: false</Text>.</Text>
            <Section padding={5} dividers={['top', 'bottom']}>
              <Text as="p" type="code">List my recorded recurring items from 2026-09-01 through 2026-09-30. Show payee, amount, currency, cadence, anchor date, and status. Use include_suggested false. Keep currencies separate and do not infer a recurring expense from transaction history.</Text>
            </Section>
            <Text as="p" color="secondary">The tool returns expected recurring transactions, not proof that a charge posted or that a provider will bill on a particular day. Treat the anchor date as a schedule reference and confirm the next charge, price, and cancellation terms with the provider.</Text>
          </VStack>

          <VStack as="section" gap={5}>
            <Heading level={2}>2. Turn the result into a monthly review</Heading>
            <Text as="p" color="secondary">A fictional result could look like this. The two monthly rows total 56.99 USD for this review window. Keep the 71.88 USD annual item separate; dividing it by twelve gives a 5.99 USD planning estimate, not a monthly charge.</Text>
            <Table data={recurringItems} columns={columns} idKey="payee" density="balanced" dividers="rows" textOverflow="wrap" />
            <Text as="p" color="secondary">For each row, compare the expected amount with the provider's current plan page or receipt. Mark what you use, what you need to investigate, and what you plan to cancel. Do not paste account numbers, tokens, or full transaction exports into the prompt.</Text>
          </VStack>

          <VStack as="section" gap={5}>
            <Heading level={2}>3. Review suggestions separately</Heading>
            <Text as="p" color="secondary">If you want candidates that Lunch Money has suggested, make a second request with <Text type="code">include_suggested: true</Text>. Keep each item's returned status visible. A suggested item is a review candidate, not a confirmed subscription.</Text>
            <Section padding={5} dividers={['top', 'bottom']}>
              <Text as="p" type="code">List recurring-item candidates for the same dates with include_suggested true. Separate reviewed records from suggestions using the returned status. Do not label a suggestion as confirmed, and do not infer a subscription from one transaction.</Text>
            </Section>
            <Text as="p" color="secondary">For example, a single fictional 48.25 USD rail ticket in transaction history is a one-off expense unless there is other verified evidence. A suggested weekly grocery pattern is still only a candidate until you review it in Lunch Money.</Text>
          </VStack>

          <VStack as="section" gap={5}>
            <Heading level={2}>4. Check dates and cancel with the provider</Heading>
            <ol>
              <li><Text as="p" color="secondary">Confirm the provider, plan name, expected amount, currency, and next billing date outside the connector.</Text></li>
              <li><Text as="p" color="secondary">Check trial end dates, annual renewals, and notice periods in the provider's current terms.</Text></li>
              <li><Text as="p" color="secondary">Cancel directly with the provider. The connector cannot perform the cancellation.</Text></li>
              <li><Text as="p" color="secondary">If needed, update the recurring item in Lunch Money itself. This connector cannot edit Lunch Money records.</Text></li>
              <li><Text as="p" color="secondary">Keep the provider's confirmation and check a later statement for another charge.</Text></li>
            </ol>
          </VStack>

          <VStack as="section" gap={5}>
            <Heading level={2}>What this workflow can and cannot establish</Heading>
            <Text as="p" color="secondary">It can organize recurring-item records returned by Lunch Money for a bounded review. It cannot prove a subscription is active, predict an exact charge, interpret a contract, or cancel anything. Review provider records before acting.</Text>
            <Text as="p" color="secondary">For connection instructions, use the <Link hasUnderline href="/#connect">website setup picker</Link> or the repository's <Link hasUnderline href="https://github.com/n3wth/lunchmoney-mcp/blob/main/docs/user-guide.md">client setup guide</Link>. For an overview of available read-only questions, return to <Link hasUnderline href="/">Lunch Money for Agents</Link>.</Text>
          </VStack>

          <SiteFooter />
        </VStack>
      </VStack>
    </AppShell>
  </Theme>
}
