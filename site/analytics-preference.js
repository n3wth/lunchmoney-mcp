document.getElementById('analytics-opt-out').addEventListener('click', function () {
  try {
    localStorage.setItem('lunchmoney-analytics-consent', JSON.stringify({enabled: false, expires: Date.now() + 180 * 86400000}))
    document.getElementById('analytics-status').textContent = 'Usage counts disabled in this browser.'
  } catch {
    document.getElementById('analytics-status').textContent = 'Your browser could not save the preference. Enable Do Not Track or Global Privacy Control to prevent collection.'
  }
})
