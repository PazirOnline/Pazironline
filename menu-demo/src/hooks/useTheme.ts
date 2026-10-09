import { useCallback, useEffect, useState } from 'react'

/**
 * Theme selection.
 *
 * Persisted so a refresh keeps the customer's chosen identity, and mirrored onto
 * <html data-theme> so a theme's CSS can scope itself without a wrapper div and
 * without a flash of the wrong background.
 */

const STORAGE_KEY = 'menudigitaly.theme.v1'
const VALID = new Set([
  'noire',
  'muse',
  'minima',
  'verde',
  'pulse',
])

function readStored(fallback: string): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored && VALID.has(stored) ? stored : fallback
  } catch {
    return fallback
  }
}

export function useTheme(fallback = 'noire') {
  const [themeId, setThemeId] = useState(() => readStored(fallback))

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, themeId)
    } catch {
      // Non-fatal: the theme still applies for this page view.
    }
  }, [themeId])

  // Scope the document so a theme's own CSS variables and body background apply
  // to the full viewport, including overscroll areas.
  useEffect(() => {
    document.documentElement.dataset.theme = themeId
  }, [themeId])

  // Switching themes resets any open overlay, otherwise a stale overlay from the
  // previous theme would remain mounted over the new one.
  const select = useCallback((id: string) => {
    if (!VALID.has(id)) return
    setThemeId(id)
  }, [])

  return { themeId, select }
}