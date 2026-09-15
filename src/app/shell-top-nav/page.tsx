// Adapted from Astryx shell-top-nav (Meta Platforms, Inc. and affiliates).
import {TopNav, TopNavHeading, TopNavItem} from '@astryxdesign/core/TopNav'
export default function ShellTopNav() {
  return <TopNav label="Main" heading={<TopNavHeading heading="lunchmoney.sh" headingHref="/" />}
    endContent={<><TopNavItem label="Install" href="#connect" /><TopNavItem label="Privacy" href="/privacy" /><TopNavItem label="GitHub" href="https://github.com/n3wth/lunchmoney-mcp" /></>} />
}
