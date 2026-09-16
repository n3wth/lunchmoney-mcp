import {hydrateRoot} from 'react-dom/client'
import App from './App'
import {trackUsage} from './analytics'
const path = window.location.pathname.replace(/\/$/, '') || '/'
hydrateRoot(document.getElementById('app')!, <App path={path} />)
if (path === '/') trackUsage('landing_viewed')
document.addEventListener('click', event => {
  if (event.target instanceof Element && event.target.closest('a[href="#connect"], a[href="/#connect"]')) trackUsage('connect_clicked')
})
