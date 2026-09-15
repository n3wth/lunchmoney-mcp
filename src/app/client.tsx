import {hydrateRoot} from 'react-dom/client'
import App from './App'
import {trackUsage} from './analytics'
hydrateRoot(document.getElementById('app')!, <App />)
trackUsage('landing_viewed')
document.addEventListener('click', event => {
  if (event.target instanceof Element && event.target.closest('a[href="#connect"]')) trackUsage('connect_clicked')
})
