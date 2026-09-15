// Adapted from Astryx shell-top-nav (Meta Platforms, Inc. and affiliates).
import {TopNav, TopNavHeading, TopNavItem} from '@astryxdesign/core/TopNav'
import {Button} from '@astryxdesign/core/Button'
export default function ShellTopNav() {
  return <TopNav label="Main" heading={<TopNavHeading heading="lunchmoney.sh" headingHref="/" />}
    endContent={<><TopNavItem label="Privacy" href="/privacy" /><Button label="Connect" href="#connect" variant="primary" size="sm" /></>} />
}
