// Adapted from Astryx shell-top-nav (Meta Platforms, Inc. and affiliates).
import {TopNav} from '@astryxdesign/core/TopNav'
import {Link} from '@astryxdesign/core/Link'
import {Text} from '@astryxdesign/core/Text'
import {Button} from '@astryxdesign/core/Button'
import {HStack} from '@astryxdesign/core/Stack'
export default function ShellTopNav() {
  return <TopNav label="Main" heading={<Link href="/" type="body"><HStack gap={2} vAlign="center"><img src="/icon.png?v=4" width="32" height="32" alt="" /><Text type="inherit" weight="semibold">Lunch Money <Text type="inherit" color="secondary" className="astryx-brand-suffix">for Agents</Text></Text></HStack></Link>}
    endContent={<Button label="Connect" href="/#connect" variant="primary" size="sm" />} />
}
