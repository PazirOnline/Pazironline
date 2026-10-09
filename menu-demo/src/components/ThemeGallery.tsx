import { useEffect } from 'react'
import type { Theme } from '../types/theme'
import { Icon, Latin, usePresence } from '../lib/ui'
import './ThemeGallery.css'

/**
 * Theme gallery — the product's theme switcher.
 *
 * This is a *product* surface, not a debug panel: each theme is presented as a
 * miniature painted from its own tokens and geometry, so a restaurant owner
 * sees five distinct rooms rather than five labelled buttons. In the real
 * product this becomes an owner-facing onboarding step.
 *
 * It is intentionally theme-independent — see ThemeGallery.css for why.
 */

/** Per-theme miniature geometry. Mirrors the theme's real radius language. */
function swatchRadius(id: string): string {
  switch (id) {
    case 'noire':
      return '20px 20px 6px 6px'
    case 'muse':
      return '44px 44px 18px 18px'
    case 'minima':
      return '2px'
    case 'verde':
      return '28px 28px 28px 6px'
    case 'pulse':
      return '2px'
    default:
      return '20px'
  }
}

function dotShape(id: string): string {
  return id === 'pulse' || id === 'minima' ? '2px' : '999px'
}

/** Latin descriptor word, e.g. «تحریری» from «لوکس · تحریری». */
function descriptorTail(descriptor: string): string {
  return descriptor.split('·').pop()?.trim() ?? descriptor
}

export function ThemeGallery({
  themes,
  activeId,
  onSelect,
  open,
  onClose,
}: {
  themes: Theme[]
  activeId: string
  onSelect: (id: string) => void
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  // Held mounted through its exit so it can recede rather than blink out
  // (motion.md §12). Same primitive the product and cart sheets use.
  const { mounted, state } = usePresence(open)
  if (!mounted) return null

  return (
    <div
      data-state={state}
      className="fixed inset-x-0 top-0 z-[60] h-[100dvh]"
      role="dialog"
      aria-modal="true"
      aria-label="انتخاب ظاهر منو"
    >
      <button
        aria-label="بستن"
        onClick={onClose}
        className="gallery-backdrop absolute inset-0"
      />

      <div className="gallery-panel relative flex h-full flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5 sm:px-8">
          <div>
            <Latin className="block text-[0.58rem] tracking-[0.34em] text-gold-300 uppercase">
              Menu Digitaly
            </Latin>
            <h2 className="mt-2.5 text-2xl leading-tight font-bold text-cream-50 sm:text-3xl">
              انتخاب ظاهر منو
            </h2>
            <p className="mt-2 max-w-md text-[0.85rem] leading-relaxed text-cream-400">
              هر ظاهر، همان منو و همان قیمت‌هاست؛ فقط زبان بصری رستوران شما تغییر می‌کند.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="بستن"
            className="press-0.9 grid size-11 shrink-0 place-items-center rounded-full border border-cream-50/15 text-cream-100"
          >
            {Icon.close}
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
          <ul className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            {themes.map((theme, i) => {
              const isActive = theme.id === activeId
              return (
                <li key={theme.id} className="gallery-item" style={{ animationDelay: `${i * 65}ms` }}>
                  <button
                    onClick={() => {
                      onSelect(theme.id)
                      onClose()
                    }}
                    aria-pressed={isActive}
                    className="gallery-card group relative flex w-full flex-col overflow-hidden text-start transition-transform duration-300 active:scale-[0.98]"
                  >
                    <span
                      className="gallery-swatch relative block h-32 w-full overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${theme.swatch[0]} 0%, ${theme.swatch[1]}4d 58%, ${theme.swatch[0]} 100%)`,
                        borderRadius: swatchRadius(theme.id),
                      }}
                      aria-hidden="true"
                    >
                      <span
                        className="absolute inset-x-5 bottom-5 h-px"
                        style={{ background: `${theme.swatch[1]}99` }}
                      />
                      <span
                        className="absolute start-5 top-6 size-2.5"
                        style={{ background: theme.swatch[1], borderRadius: dotShape(theme.id) }}
                      />
                      <span
                        className="absolute bottom-7 start-16 text-xl leading-none font-light"
                        style={{ color: theme.swatch[1], opacity: 0.92 }}
                      >
                        <Latin>{theme.latin}</Latin>
                      </span>
                      <span
                        className="absolute bottom-2.5 start-16 text-[0.5rem] tracking-[0.28em] uppercase"
                        style={{ color: theme.swatch[1], opacity: 0.6 }}
                      >
                        <Latin>{descriptorTail(theme.descriptor)}</Latin>
                      </span>
                    </span>

                    <span className="flex flex-1 flex-col gap-1.5 p-4">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-base font-bold text-cream-50">{theme.name}</span>
                        <Latin className="text-[0.58rem] tracking-[0.24em] text-gold-300 uppercase">
                          {theme.latin}
                        </Latin>
                      </span>
                      <span className="text-[0.78rem] leading-relaxed text-cream-400">
                        {theme.pitch}
                      </span>
                      {theme.flagship && (
                        <span className="mt-1 w-fit rounded-full bg-gold-400/15 px-2.5 py-1 text-[0.62rem] text-gold-200">
                          تم پیش‌فرض
                        </span>
                      )}
                      {isActive && <span className="sr-only">تم فعال</span>}
                    </span>

                    {isActive && (
                      <span
                        className="absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-gold-400 text-ink-950"
                        aria-hidden="true"
                      >
                        {Icon.check}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

/**
 * Floating control that opens the gallery.
 *
 * `raised` lifts it clear of the cart bar: on a phone both occupy the bottom of
 * the screen, and two stacked floating bars would cover each other.
 */
export function ThemeTrigger({ onOpen, raised, hidden }: { onOpen: () => void; raised: boolean; hidden: boolean }) {
  if (hidden) return null

  return (
    // A fixed element resolves against the *layout* viewport, which on a phone is
    // taller than the visible area whenever the browser chrome is expanded. A
    // bottom-anchored button would therefore sit below the screen. The full-height
    // wrapper pins it to the dynamic viewport instead.
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex h-[100dvh] items-end justify-start ps-3"
      style={{
        paddingBottom: raised
          ? 'calc(max(0.75rem, env(safe-area-inset-bottom)) + 5rem)'
          : 'max(0.75rem, env(safe-area-inset-bottom))',
      }}
    >
      <button
        onClick={onOpen}
        aria-label="انتخاب ظاهر منو"
        className="gallery-trigger pointer-events-auto flex items-center gap-2 rounded-full px-3 py-2 transition-transform duration-300 active:scale-95"
      >
        <span
          className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500"
          style={{
            boxShadow: raised ? '0 0 0 3px color-mix(in oklab, #d3a85f 25%, transparent)' : undefined,
          }}
        >
          <Latin className="text-[0.6rem] font-bold tracking-widest text-ink-950">MD</Latin>
        </span>
        <span className="hidden text-xs text-cream-200 sm:block">ظاهر منو</span>
      </button>
    </div>
  )
}