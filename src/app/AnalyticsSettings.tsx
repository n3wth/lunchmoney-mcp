import {useEffect, useState} from 'react'
import {VStack} from '@astryxdesign/core/Stack'
import {Text} from '@astryxdesign/core/Text'
import {Button} from '@astryxdesign/core/Button'
import {Collapsible} from '@astryxdesign/core/Collapsible'
import {analyticsEnabled, setAnalytics, trackUsage} from './analytics'

export default function AnalyticsSettings() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    setEnabled(analyticsEnabled())
    trackUsage('landing_viewed')
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a[href="#connect"]')) trackUsage('connect_clicked')
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return <VStack id="analytics" paddingBlockEnd={6}>
    <Collapsible defaultIsOpen={false} trigger={<Text type="supporting">Analytics settings</Text>}>
      <VStack gap={3} paddingBlock={4}>
        <Text type="supporting">Optional usage counts help improve this site. With your consent, PostHog in the US receives page-view, Connect-click and prompt-copy events. No financial data, session recordings or persistent visitor IDs. Your choice is saved for 180 days. Privacy signals keep analytics off.</Text>
        <Button size="sm" variant="secondary" label={enabled ? 'Disable analytics' : 'Enable analytics'} onClick={() => {
          setAnalytics(!enabled)
          const next = analyticsEnabled()
          setEnabled(next)
          if (next) trackUsage('landing_viewed')
        }} />
        <Text type="supporting" aria-live="polite">Analytics {enabled ? 'enabled' : 'disabled'}.</Text>
      </VStack>
    </Collapsible>
  </VStack>
}
