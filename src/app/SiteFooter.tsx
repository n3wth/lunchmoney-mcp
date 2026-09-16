import {VStack, HStack} from '@astryxdesign/core/Stack'
import {Text} from '@astryxdesign/core/Text'
import {Link} from '@astryxdesign/core/Link'
const repo = 'https://github.com/n3wth/lunchmoney-mcp'
export default function SiteFooter() { return (
          <VStack as="footer" className="astryx-page-section" width="100%" gap={4}>
            <HStack width="100%" gap={4} wrap="wrap" hAlign="between" vAlign="start">
              <Link href="https://lunchmoney.app/?refer=94dziuj5" rel="sponsored" label="Powered by Lunch Money (referral link)">
                <img src="/powered-by-lunch-money.png" width="209" height="60" alt="Powered by Lunch Money" loading="lazy" />
              </Link>
            <VStack gap={3} hAlign="end">
              <Text type="supporting" justify="end">Unofficial integration by <Link href="https://n3wth.com" type="inherit" color="inherit">n3wth</Link>. Not affiliated with or endorsed by Lunch Money.</Text>
            <HStack gap={4} vAlign="center">
              <Link href={repo} type="supporting" color="secondary">GitHub</Link>
              <Link href="/terms" type="supporting" color="secondary">Terms</Link>
              <Link href="/security" type="supporting" color="secondary">Security</Link>
              <Link href="/privacy" type="supporting" color="secondary">Privacy</Link>
            </HStack>
            </VStack>
            </HStack>
          </VStack>
) }
