// Adapted from Astryx shell-top-nav (Meta Platforms, Inc. and affiliates).
import {TopNav} from '@astryxdesign/core/TopNav'
import {Link} from '@astryxdesign/core/Link'
import {Text} from '@astryxdesign/core/Text'
import {Button} from '@astryxdesign/core/Button'
export default function ShellTopNav() {
  return <TopNav label="Main" heading={<Link href="/" type="body"><Text type="inherit" weight="semibold">Lunch Money <Text type="inherit" color="secondary">for Agents</Text></Text></Link>}
    endContent={<Button label="Connect" href="#connect" variant="primary" size="sm" />} />
}
