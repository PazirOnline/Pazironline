import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

/**
 * Apply the persisted theme before React mounts.
 *
 * `useTheme` would set this in an effect, which runs *after* first paint — that
 * would show a flash of the default background on every load. Setting
 * `data-theme` here, and re-applying the matching stylesheet, means the correct
 * background is painted immediately (see index.html for the pre-paint colour).
 */
function primeTheme() {
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem('menudigitaly.theme.v1')
  } catch {
    stored = null
  }
  const valid = ['noire', 'muse', 'minima', 'verde', 'pulse']
  const id = stored && valid.includes(stored) ? stored : 'noire'
  document.documentElement.dataset.theme = id
}

primeTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)