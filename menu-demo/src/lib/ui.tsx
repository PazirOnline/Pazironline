import { useEffect, useState } from 'react'
import type { Choice, Money, OptionGroup as OptionGroupType, Product, Variant } from '../types/catalog'

/**
 * Shared presentation primitives.
 *
 * Each theme supplies its own *look* for these (radius language, shadow, easing,
 * entrance animation). The behaviour is shared so accessibility and scroll
 * behaviour cannot drift between themes.
 */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const
const ARABIC_THOUSANDS = '٬' // U+066C

/** 1234 -> ۱۲۳۴ */
export function toFaDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

/** 95000 -> ۹۵٬۰۰۰ */
export function groupFa(value: number): string {
  return toFaDigits(value.toLocaleString('en-US')).replace(/,/g, ARABIC_THOUSANDS)
}

/** 95000 -> «۹۵٬۰۰۰ تومان» */
export function formatToman(value: Money): string {
  return `${groupFa(value)} تومان`
}

/** Quantity + noun, e.g. «۲ آیتم» */
export function itemCountLabel(count: number): string {
  return `${toFaDigits(count)} آیتم`
}

/**
 * Money display.
 *
 * `DECIDED` (design-system §4.3): tabular numerals so figures align in lists and
 * totals. The currency unit label placement is `OPEN QUESTION` (U-4) — every
 * theme routes through this so a change is one edit.
 */
export function Price({
  value,
  size = 'md',
  className = '',
}: {
  value: Money
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'cta'
  className?: string
}) {
  // Weight lives here rather than on the inner number span, so a caller can
  // promote the whole price with `font-bold` and the digits follow it.
  const sizes = {
    sm: 'text-[0.8rem] font-medium',
    md: 'text-[0.95rem] font-medium',
    lg: 'text-lg font-semibold',
    xl: 'text-2xl font-bold',
    // The primary call to action. A price is the thing the customer is
    // actually committing to, so it must not be set smaller than the label
    // beside it - it was rendering at 0.8rem next to a 1rem bold label and
    // reading as an aside.
    cta: 'text-[1.05rem] font-bold',
  } as const

  return (
    <span className={`tnum inline-flex items-baseline gap-1.5 ${sizes[size]} ${className}`}>
      <span>{groupFa(value)}</span>
      <span className="text-[0.66em] font-medium opacity-70">تومان</span>
    </span>
  )
}

/**
 * Latin text inside RTL layout.
 *
 * `DECIDED` (C3): Latin product and brand names are common and must not be
 * reordered into nonsense. Isolation is mandatory, not cosmetic.
 */
export function Latin({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`latin ${className}`}>{children}</span>
}

/**
 * Keep an overlay mounted long enough to animate *out*.
 *
 * `DECIDED` (motion.md §7): an overlay that unmounts on the same frame it is
 * dismissed has no exit to animate, so every sheet used to disappear instantly
 * while taking a quarter second to arrive. This holds the element for the exit
 * duration and exposes `state` so CSS can switch between enter and leave.
 *
 * Exits run on --motion-ease-accelerate (fast away, unhurried arrival), which is
 * why the duration differs by direction.
 */
export function usePresence(open: boolean, exitMs = 220) {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    // Leave the node in the tree, flagged closing, until the exit finishes.
    const timer = window.setTimeout(() => setMounted(false), exitMs)
    return () => window.clearTimeout(timer)
  }, [open, exitMs])

  return { mounted, state: open ? ('open' as const) : ('closing' as const) }
}

/**
 * Overlay behaviour shared by every modal surface.
 *
 * Escape-to-close plus scroll lock, implemented once so no theme can trap the
 * page or let it scroll behind a sheet.
 */
export function useOverlay(open: boolean, onClose: () => void) {
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
}

/**
 * Scroll-spy across theme-rendered sections.
 *
 * Sections are laid out by the theme, so this measures the DOM rather than
 * assuming a layout. Returns the active category id for the nav.
 *
 * `fallbackOffset` is only a fallback. The boundary each section is judged
 * against is that section's own `scroll-margin-top`, read at measure time.
 *
 * That distinction matters: tapping a chip calls scrollIntoView, and
 * scroll-margin-top is what decides where the browser parks the section — so
 * the spy has to compare against the same number, not a guess. Comparing
 * against one hardcoded offset instead means that whenever a theme's margin is
 * larger (each theme clears its sticky rail differently: 64px to 112px), the
 * section you just scrolled to still reads as "not reached yet", the nav falls
 * back to the previous chip, and the tap appears to do nothing. The user then
 * taps again — by which point there is nothing left to scroll, so only the
 * selection sticks and the chip finally highlights.
 *
 * `railOffset` was that hardcoded 90, and it was 5px from being wrong for
 * PULSE as well.
 */
export function useScrollSpy(categoryIds: string[], fallbackOffset = 90) {
  const [activeId, setActiveId] = useState(categoryIds[0])
  // categoryIds is rebuilt on every render by the caller; a joined key keeps the
  // scroll subscription from being torn down and rebuilt continuously.
  const key = categoryIds.join('|')

  useEffect(() => {
    const ids = key.split('|').filter(Boolean)
    if (ids.length === 0) return

    // The line a section has to cross to count as "reached": the offset
    // scrollIntoView will park it at.
    //
    // The tolerance band is not slack for its own sake. A section that lands
    // *at* its scroll-margin-top sits exactly on this boundary, and a smooth
    // scroll can settle a few px past it through subpixel rounding — MINIMA on
    // a 320px screen parks at 70px while declaring 64px. Judged to the pixel,
    // that section reads as unreached and the nav sits one chip behind. A dozen
    // px is invisible next to sections hundreds of px tall, and it makes the
    // boundary a band rather than a knife edge.
    const REACHED_SLACK = 12

    const reached = (el: HTMLElement) => {
      const margin = parseFloat(getComputedStyle(el).scrollMarginTop)
      const offset = Number.isFinite(margin) ? margin : fallbackOffset
      return el.getBoundingClientRect().top - offset <= REACHED_SLACK
    }

    // The final section may not have enough content below it to ever reach its
    // own scroll-margin-top — the page simply runs out. Without this, its chip
    // would be permanently unselectable, which reads as a dead control.
    const atBottom = () =>
      Math.ceil(window.scrollY + window.innerHeight) >=
      document.documentElement.scrollHeight - 2

    const compute = () => {
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(`section-${id}`)
        if (!(el instanceof HTMLElement)) continue
        if (reached(el)) current = id
      }
      if (atBottom()) {
        current = ids[ids.length - 1]
      } else {
        const first = document.getElementById(`section-${ids[0]}`)
        // Pin to the first category while still in the hero / signature area.
        if (first instanceof HTMLElement && !reached(first)) {
          current = ids[0]
        }
      }
      setActiveId(current)
    }

    compute()
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
    }
  }, [key, fallbackOffset])

  return [activeId, setActiveId] as const
}

/**
 * Scrolling a section into view beneath a sticky rail of unknown height.
 * Shared so every theme's nav lands on the same place.
 */
export function scrollToSection(id: string) {
  document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Option group shape used by themes; the id/labels come straight from data. */
export function OptionChoices({
  group,
  selectedId,
  onSelect,
  className = '',
  choiceClassName = '',
}: {
  group: OptionGroupType
  selectedId: string | undefined
  onSelect: (groupId: string, choiceId: string) => void
  className?: string
  choiceClassName?: string
}) {
  return (
    <fieldset className={className}>
      <legend className="mb-3 text-sm font-medium">{group.label}</legend>
      <div className="flex flex-wrap gap-2">
        {group.choices.map((choice: Choice) => {
          const active = selectedId === choice.id
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => onSelect(group.id, choice.id)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm press-0.95 ${choiceClassName}`}
            >
              {choice.label}
              {choice.price > 0 && (
                <span className="tnum text-[0.72rem]">
                  <span className="latin">+{groupFa(choice.price)}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * Variant selection for a product sold in more than one size or form.
 *
 * Two affordances on one row, matching how menus like this are actually used:
 * tapping the row *selects* that variant (so the quantity stepper and the
 * primary CTA act on it), while the pill on the end *adds* that variant
 * immediately. That way a customer who wants one single and one double is not
 * forced to open the sheet twice.
 *
 * Themes supply the look through the class hooks; the behaviour is shared so
 * keyboard and screen-reader semantics cannot drift between themes.
 */
export function VariantRows({
  variants,
  selectedId,
  onSelect,
  onAdd,
  className = '',
  rowClassName = '',
  selectedRowClassName = '',
  addClassName = '',
  addLabel = 'افزودن',
}: {
  variants: Variant[]
  selectedId: string | undefined
  onSelect: (id: string) => void
  /** Omit to render a purely selectable list. */
  onAdd?: (variant: Variant) => void
  className?: string
  rowClassName?: string
  selectedRowClassName?: string
  addClassName?: string
  addLabel?: string
}) {
  return (
    <div className={className}>
      <ul role="radiogroup" aria-label="اندازه‌ها" className="flex flex-col gap-2">
        {variants.map((variant) => {
          const active = variant.id === selectedId
          const unavailable = variant.available === false
          return (
            <li
              key={variant.id}
              className={`flex items-center gap-2 rounded-2xl pr-3 pl-2 ${
                active ? selectedRowClassName : rowClassName
              }`}
            >
              <button
                type="button"
                role="radio"
                aria-checked={active}
                disabled={unavailable}
                onClick={() => onSelect(variant.id)}
                className="flex min-w-0 flex-1 items-center gap-2 py-3 text-start"
              >
                <span className={`truncate text-[0.95rem] ${unavailable ? 'line-through opacity-50' : 'font-semibold'}`}>
                  {variant.label}
                </span>
                {active && !unavailable && (
                  <span className="shrink-0" aria-hidden="true">
                    {Icon.check}
                  </span>
                )}
              </button>

              <Price value={variant.price} size="sm" className="shrink-0" />

              {onAdd && (
                <button
                  type="button"
                  disabled={unavailable}
                  onClick={() => onAdd(variant)}
                  aria-label={`${addLabel} ${variant.label}`}
                  className={`press-0.96 flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[0.8rem] font-semibold disabled:opacity-40 ${addClassName}`}
                >
                  {Icon.plus}
                  {addLabel}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Fold a variant into the cart's existing `Choice` pipeline.
 *
 * A variant carries an absolute price but `Choice.price` is a delta, so the
 * difference against the base price is what gets stored. That is what lets the
 * untouched cart do the rest: `lineKey` hashes the choice ids so single and
 * double never merge into one line, and `unitPrice` sums the deltas so the
 * total is already correct.
 */
export function variantChoice(product: Product, variant: Variant): Choice {
  return {
    // Prefixed so it can never collide with a real option group id.
    id: `variant:${variant.id}`,
    label: variant.label,
    price: variant.price - product.price,
  }
}

/**
 * Holds the chosen variant for a product sheet and exposes it as a `Choice`.
 *
 * Folding the variant into the existing `selected` array is what keeps the cart
 * honest for free: no cart code changes at all, and the customer sees the
 * variant spelled out on the cart line, which is exactly what you want to read
 * before paying.
 */
export function useVariantSelection(product: Product) {
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id)

  useEffect(() => {
    setVariantId(product.variants?.[0]?.id)
  }, [product])

  const variant = product.variants?.find((v) => v.id === variantId)
  const choice = variant ? variantChoice(product, variant) : null

  return { variant, variantId, setVariantId, variantChoice: choice }
}

/** Icon set. Stroke-only, inherits currentColor. */
export const Icon = {
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  minus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  ),
  chevronStart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12l5 5L20 6" />
    </svg>
  ),
  arrowUp: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
}