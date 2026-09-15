const consentKey = 'lunchmoney-analytics-consent'
const events = new Set(['landing_viewed', 'connect_clicked', 'setup_prompt_copied'])
export function analyticsEnabled() {
  try {
    const consent = JSON.parse(localStorage.getItem(consentKey) || 'null')
    return consent?.enabled === true && consent.expires > Date.now() && navigator.doNotTrack !== '1' && !(navigator as Navigator & {globalPrivacyControl?: boolean}).globalPrivacyControl
  } catch { return false }
}
export function setAnalytics(enabled: boolean) {
  try { localStorage.setItem(consentKey, JSON.stringify({enabled, expires: Date.now() + 180 * 86400000})) } catch { /* Stay disabled if storage is unavailable. */ }
}
export function trackUsage(event: string) {
  if (!events.has(event) || !analyticsEnabled() || location.hostname !== 'lunchmoney.sh') return
  // Explicit payload only. No SDK, page URL, referrer, identity, or DOM capture.
  void fetch('https://us.i.posthog.com/i/v0/e/', {
    method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({api_key: 'phc_q39ZGuvXLQuwCgCkHZYAeaUlWm5bIhx2XKMCtTdhJ7o', event: 'lunchmoney_' + event, distinct_id: crypto.randomUUID(), properties: {$process_person_profile: false, $ip: '0.0.0.0', $geoip_disable: true, site: 'lunchmoney.sh'}}),
  }).catch(() => {})
}
