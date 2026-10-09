import type { Theme } from '../types/theme'
import { noirTheme } from './noire'
import { museTheme } from './muse'
import { minimaTheme } from './minima'
import { verdeTheme } from './verde'
import { pulseTheme } from './pulse'

/**
 * Theme registry.
 *
 * `DECIDED`: registration is by module, not by editing a switch statement.
 * Adding Theme 6 means adding one import and one array entry — nothing in the
 * shell, the gallery, or the routing changes.
 *
 * The id is a plain `string` throughout (see types/theme.ts) precisely so this
 * file does not need a code change when a sixth theme appears.
 */
export const themes: Theme[] = [
  noirTheme,
  museTheme,
  minimaTheme,
  verdeTheme,
  pulseTheme,
]

export const defaultThemeId = 'noire'

export const getTheme = (id: string): Theme =>
  themes.find((theme) => theme.id === id) ?? themes[0]

export const flagshipTheme = themes.find((theme) => theme.flagship) ?? themes[0]