import { useEffect, useMemo, useRef, useState } from 'react'
import type { Category, Product, Section } from '../types/catalog'
import type { CartView, ProductSheetView, Theme } from '../types/theme'
import { Icon, Latin, OptionChoices, Price, VariantRows, useOverlay, usePresence, useVariantSelection, variantChoice } from '../lib/ui'
import { hashUnit, imageSrc, imageSrcSet, stagger } from '../lib/media'
import './muse.css'

/**
 * MUSE — Theme 02. Fantasy / Whimsical, at a luxury register.
 *
 * Structural differences from NOIRÉ, deliberately not a recolour:
 *  - Aurora colour field that drifts, instead of static radial warmth
 *  - Arched portrait tiles (a clipped top edge) instead of plain rectangles
 *  - Ornamental flourishes and twinkling marks as a real layout element
 *  - Cards that breathe on independent periods
 *  - Cart opens as a floating panel with a spring, not a bottom drawer
 *  - Option chips that spring rather than cross-fade
 */

/* ── Backdrop ─────────────────────────────────────────────────────────── */

function Backdrop() {
  return (
    <>
      <div className="muse-aurora" aria-hidden="true" />
      <div className="muse-grain" aria-hidden="true" />
    </>
  )
}

/** Deterministic sparkle placement — no Math.random, so SSR-free and stable. */
function Sparkles({ seed }: { seed: string }) {
  const marks = useMemo(() => {
    const unit = hashUnit(seed)
    return Array.from({ length: 5 }, (_, i) => {
      const a = hashUnit(`${seed}-x${i}`)
      const b = hashUnit(`${seed}-y${i}`)
      const c = hashUnit(`${seed}-z${i}`)
      return {
        top: `${8 + a * 62}%`,
        insetInlineStart: `${4 + b * 88}%`,
        size: 4 + c * 7,
        delay: `${(i * 0.7 + unit).toFixed(2)}s`,
        duration: `${3 + c * 3.4}s`,
      }
    })
  }, [seed])

  return (
    <>
      {marks.map((mark, i) => (
        <span
          key={i}
          className="muse-sparkle"
          style={{
            top: mark.top,
            insetInlineStart: mark.insetInlineStart,
            width: mark.size,
            height: mark.size,
            ['--delay' as string]: mark.delay,
            ['--twinkle' as string]: mark.duration,
          }}
        />
      ))}
    </>
  )
}

function Flourish() {
  return (
    <div className="muse-flourish" aria-hidden="true">
      <span className="muse-flourish-mark" />
    </div>
  )
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

type VenueProps = { venue: import('../types/catalog').Venue }

function Hero({ venue }: VenueProps) {
  return (
    <header className="muse-rise relative overflow-hidden px-5 pt-14 pb-10 sm:px-8 sm:pt-20">
      {/* Soft photographic halo behind the identity, feathered into the field. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 flex justify-center">
        <img
          src={`/images/${venue.cover}-lg.webp`}
          alt=""
          aria-hidden="true"
          className="muse-photo h-64 w-full object-cover opacity-20 blur-3xl sm:h-80"
          style={{ maskImage: 'radial-gradient(60% 70% at 50% 30%, #000, transparent 75%)' }}
          loading="eager"
          decoding="async"
        />
      </div>

      <Sparkles seed={venue.id} />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        {/* Monogram inside a slowly orbiting ring — the theme's one ornament
            that reads as craft rather than decoration. */}
        <div className="relative grid place-items-center">
          <span
            className="muse-orbit absolute rounded-full"
            style={{ width: 132, height: 132, ['--orbit' as string]: '66px' }}
            aria-hidden="true"
          >
            <span className="absolute -top-0.5 start-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[color:var(--accent-soft)] shadow-[0_0_10px_var(--accent)]" />
            <span className="absolute bottom-1 end-0 size-1 rounded-full bg-[color:var(--accent-alt)]" />
          </span>

          <div
            className="muse-lit relative grid size-[4.5rem] place-items-center rounded-full sm:size-24"
            style={{
              background:
                'radial-gradient(circle at 30% 25%, color-mix(in oklab, var(--accent-soft) 90%, transparent), color-mix(in oklab, var(--accent-deep) 85%, transparent))',
              boxShadow: '0 0 44px color-mix(in oklab, var(--accent) 45%, transparent)',
            }}
          >
            <Latin className="font-display text-3xl leading-none font-light text-[color:var(--on-accent)] sm:text-4xl">
              {venue.monogram}
            </Latin>
          </div>
        </div>

        <div className="mt-8">
          <Flourish />
        </div>

        <h1 className="mt-5 flex flex-col items-center gap-2">
          <Latin className="font-display text-[2.6rem] leading-none font-light tracking-[0.3em] ps-[0.3em] sm:text-6xl">
            {venue.latin}
          </Latin>
          <span className="text-lg font-medium tracking-[0.06em] text-[color:var(--text)] sm:text-xl">
            {venue.name}
          </span>
        </h1>

        <p className="mt-4 text-[0.95rem] text-[color:var(--text-dim)]">{venue.descriptor}</p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <span className="muse-glass rounded-full px-4 py-1.5 text-xs text-[color:var(--text-dim)]">
            {venue.status}
          </span>
          <span className="muse-glass rounded-full px-4 py-1.5 text-xs text-[color:var(--text-mute)]">
            {venue.location}
          </span>
        </div>

        <p className="mt-6 text-sm text-[color:var(--text-mute)]">{venue.tagline}</p>
      </div>
    </header>
  )
}

/* ── Category nav ─────────────────────────────────────────────────────── */

function CategoryNav({
  categories,
  activeId,
  onSelect,
}: {
  categories: Category[]
  activeId: string
  onSelect: (id: string) => void
}) {
  const railRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const chip = chipRefs.current[activeId]
    const rail = railRef.current
    if (!chip || !rail) return
    // `inline: 'nearest'` rather than 'center': 'center' over-scrolls the rail
    // and eats the inline padding, which visually clips the first chip.
    const chipBox = chip.getBoundingClientRect()
    const railBox = rail.getBoundingClientRect()
    if (chipBox.right > railBox.right || chipBox.left < railBox.left) {
      chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  }, [activeId])

  return (
    <div className="sticky top-0 z-40">
      <div className="muse-bar">
        {/* Mirrors the section wrapper: full-bleed padding on the outside, the
            rail centred to the same column width as the menu below it. */}
        <div className="px-5 sm:px-8">
        <div
          ref={railRef}
          className="no-scrollbar rail mx-auto w-full max-w-3xl items-center gap-2.5 py-3"
          role="tablist"
          aria-label="دسته‌بندی منو"
        >
          {categories.map((category) => {
            const isActive = category.id === activeId
            return (
              <button
                key={category.id}
                ref={(el) => {
                  chipRefs.current[category.id] = el
                }}
                role="tab"
                aria-selected={isActive}
                data-selected={isActive}
                onClick={() => {
                  document
                    .getElementById(`section-${category.id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  onSelect(category.id)
                }}
                className="muse-chip shrink-0 snap-start rounded-full px-5 py-2.5 text-sm transition-all duration-300"
              >
                {category.name}
              </button>
            )
          })}
        </div>
        </div>
      </div>
    </div>
  )
}

/* ── Product card ─────────────────────────────────────────────────────── */

/** Arched portrait mask — MUSE's signature silhouette. */
const ARCH = '50% 50% 1.75rem 1.75rem / 34% 34% 1rem 1rem'

function ProductCard({
  product,
  onOpen,
}: {
  product: Product
  onOpen: (product: Product) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [broken, setBroken] = useState(false)
  const unavailable = !product.available
  const breathe = 5.6 + hashUnit(product.id) * 3.4

  return (
    <button
      onClick={() => onOpen(product)}
      aria-disabled={unavailable}
      className="muse-lit group relative flex w-full flex-col overflow-hidden text-start"
      style={{
        borderRadius: 'var(--radius)',
        background: 'color-mix(in oklab, var(--surface) 55%, transparent)',
        boxShadow: 'var(--shadow-lift)',
        ['--breathe' as string]: `${breathe}s`,
      }}
    >
      <div
        className="aspect-[4/5] w-full shrink-0 overflow-hidden bg-[color:var(--surface)]"
        style={{ borderRadius: ARCH }}
      >
        {broken ? (
          <span className="media-fallback h-full w-full font-display text-2xl">
            {product.latinName ?? product.name}
          </span>
        ) : (
          <img
            src={imageSrc(product, 'sm')}
            srcSet={imageSrcSet(product)}
            sizes="(max-width: 640px) 45vw, 220px"
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setBroken(true)}
            className={`muse-photo h-full w-full object-cover ${loaded ? '' : 'scale-105 blur-md'}`}
          />
        )}
        <div className="muse-scrim absolute inset-0" />

        {product.badge && !unavailable && (
          <span className="muse-glass absolute top-3 end-3 max-w-[78%] truncate rounded-full px-3 py-1 text-[0.62rem] text-[color:var(--accent-soft)]">
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[0.95rem] leading-snug font-semibold text-[color:var(--text)]">
            {product.name}
          </h3>
          {unavailable && (
            <span className="muse-sold-out shrink-0 rounded-full px-2.5 py-1 text-[0.62rem]">
              ناموجود
            </span>
          )}
        </div>

        <p className="line-clamp-2 text-[0.78rem] leading-relaxed text-[color:var(--text-mute)]">
          {product.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <Price value={product.price} className="text-[color:var(--accent-soft)]" />
          {!unavailable && (
            <span className="muse-add grid size-9 shrink-0 place-items-center rounded-full" aria-hidden="true">
              {Icon.plus}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ── Signature card ───────────────────────────────────────────────────── */

function SignatureCard({
  product,
  onOpen,
}: {
  product: Product
  onOpen: (product: Product) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [broken, setBroken] = useState(false)

  return (
    <button
      onClick={() => onOpen(product)}
      className="muse-lit group relative flex h-full w-full flex-col overflow-hidden text-start"
      style={{
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lift)',
      }}
    >
      <div
        className="aspect-[3/4] w-full shrink-0 overflow-hidden bg-[color:var(--surface)]"
        style={{ borderRadius: '50% 50% var(--radius-lg) var(--radius-lg) / 30% 30% 2.75rem 2.75rem', ['--breathe' as string]: '7s' }}
      >
        {broken ? (
          <span className="media-fallback h-full w-full font-display text-2xl">
            {product.latinName ?? product.name}
          </span>
        ) : (
          <img
            src={imageSrc(product, 'lg')}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setBroken(true)}
            className={`muse-photo h-full w-full object-cover ${loaded ? '' : 'scale-105 blur-md'}`}
          />
        )}
        <div className="muse-scrim absolute inset-0" />

        {product.badge && (
          <span className="muse-glass absolute top-4 end-4 max-w-[76%] truncate rounded-full px-3 py-1 text-[0.65rem] text-[color:var(--accent-soft)]">
            {product.badge}
          </span>
        )}

        <Sparkles seed={product.id} />

        <div className="absolute inset-x-0 bottom-0 p-4">
          {product.latinName && (
            <Latin className="mb-1 block truncate text-[0.58rem] tracking-[0.24em] text-[color:var(--accent)] uppercase">
              {product.latinName}
            </Latin>
          )}
          <h3 className="line-clamp-2 text-[1.05rem] leading-tight font-semibold text-[color:var(--text)]">
            {product.name}
          </h3>
          <p className="mt-1.5 hidden text-[0.8rem] leading-relaxed text-[color:var(--text-dim)] sm:line-clamp-2 sm:block">
            {product.description}
          </p>
          <div className="mt-3">
            <Price value={product.price} className="text-[color:var(--accent-soft)]" />
          </div>
        </div>
      </div>
    </button>
  )
}

/* ── Category section ─────────────────────────────────────────────────── */

function CategorySection({
  section,
  onOpen,
}: {
  section: Section
  onOpen: (product: Product) => void
}) {
  const { category, items } = section
  return (
    <section
      id={`section-${category.id}`}
      aria-labelledby={`heading-${category.id}`}
      className="scroll-mt-28 px-5 py-10 sm:px-8 sm:py-14"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <h2
            id={`heading-${category.id}`}
            className="font-display text-3xl leading-none font-light tracking-wide text-[color:var(--text)] sm:text-4xl"
          >
            {category.name}
          </h2>
          <Latin className="text-[0.62rem] tracking-[0.42em] text-[color:var(--accent)] uppercase">
            {category.latin}
          </Latin>
          <Flourish />
        </div>

        {/* Two columns from the smallest phone: the arched tiles need the
            portrait aspect ratio to read correctly. */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5">
          {items.map((product, i) => (
            <div key={product.id} className="muse-rise" style={{ animationDelay: `${stagger(i, 70)}ms` }}>
              <ProductCard product={product} onOpen={onOpen} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Product sheet ────────────────────────────────────────────────────── */

function ProductSheet({ product, onClose, onAdd, state }: ProductSheetView) {
  const [quantity, setQuantity] = useState(1)
  const [selected, setSelected] = useState<Record<string, string>>({})

  useEffect(() => {
    setQuantity(1)
    setSelected(
      Object.fromEntries(
        (product.options ?? [])
          .filter((group) => group.required && group.choices.length)
          .map((group) => [group.id, group.choices[0].id]),
      ),
    )
  }, [product])

  const { variantId, setVariantId, variantChoice: variantPick } = useVariantSelection(product)

  const chosen = useMemo(
    () =>
      (product.options ?? []).flatMap((group) => {
        const choice = group.choices.find((c) => c.id === selected[group.id])
        return choice ? [choice] : []
      }),
    [product, selected],
  )

  const priced = variantPick ? [...chosen, variantPick] : chosen
  const unitPrice = product.price + priced.reduce((s, c) => s + c.price, 0)
  const unavailable = !product.available

  useOverlay(state === 'open', onClose)

  return (
    <div data-state={state} className="fixed inset-x-0 top-0 z-50 flex h-[100dvh] items-end justify-center sm:items-center">
      <button
        aria-label="بستن"
        onClick={onClose}
        className="muse-fade absolute inset-0 bg-[color:color-mix(in_oklab,var(--bg)_78%,transparent)] backdrop-blur-md"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="muse-sheet muse-glass relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden"
        style={{ borderRadius: 'var(--radius-lg)' }}
      >
        <div
          className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[color:var(--surface)] sm:aspect-[16/11]"
          style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}
        >
          <img
            src={imageSrc(product, 'lg')}
            alt={product.name}
            decoding="async"
            className="muse-photo h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, var(--bg), color-mix(in oklab, var(--bg) 26%, transparent) 52%, transparent)',
            }}
          />
          <button
            onClick={onClose}
            className="muse-glass absolute top-4 end-4 grid size-10 place-items-center rounded-full text-[color:var(--text)] press-0.90"
            aria-label="بستن"
          >
            {Icon.close}
          </button>
          <Sparkles seed={product.id} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-4">
          {product.latinName && (
            <Latin className="mb-1.5 block text-[0.62rem] tracking-[0.4em] text-[color:var(--accent)] uppercase">
              {product.latinName}
            </Latin>
          )}
          <h2 className="font-display text-4xl leading-none font-light text-[color:var(--text)]">
            {product.name}
          </h2>

          <div className="mt-4">
            <Flourish />
          </div>

          <p className="mt-4 text-[0.92rem] leading-relaxed text-[color:var(--text-dim)]">
            {product.description}
          </p>

          {unavailable && (
            <div className="muse-sold-out mt-5 rounded-2xl px-4 py-3 text-sm">
              این آیتم در حال حاضر ناموجود است.
            </div>
          )}

          {!unavailable &&
            product.options?.map((group) => (
              <OptionChoices
                key={group.id}
                group={group}
                selectedId={selected[group.id]}
                onSelect={(groupId, choiceId) =>
                  setSelected((s) => ({ ...s, [groupId]: choiceId }))
                }
                className="mt-7"
                choiceClassName="muse-choice"
              />
            ))}
          {!unavailable && product.variants && product.variants.length > 0 && (
            <VariantRows
              variants={product.variants}
              selectedId={variantId}
              onSelect={setVariantId}
              onAdd={(v) => {
                onAdd(product, 1, [...chosen, variantChoice(product, v)])
                onClose()
              }}
              className="mt-7"
              rowClassName="muse-glass"
              selectedRowClassName="muse-glass muse-lit"
              addClassName="muse-cta"
            />
          )}

        </div>

        <div className="safe-b shrink-0 px-6 pt-4">
          {!unavailable && (
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-[color:var(--text-dim)]">تعداد</span>
              <div className="muse-glass flex items-center gap-1 rounded-full p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="کاهش تعداد"
                  className="muse-step grid size-10 place-items-center rounded-full text-[color:var(--text)] disabled:opacity-30"
                >
                  {Icon.minus}
                </button>
                <span className="tnum w-8 text-center text-base font-semibold">
                  {quantity.toLocaleString('fa-IR', { useGrouping: false })}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  aria-label="افزایش تعداد"
                  className="muse-step grid size-10 place-items-center rounded-full text-[color:var(--text)]"
                >
                  {Icon.plus}
                </button>
              </div>
            </div>
          )}

          <button
            data-cta="add-to-cart"
            disabled={unavailable}
            onClick={() => {
              onAdd(product, quantity, priced)
              onClose()
            }}
            className="muse-cta muse-cta-sheen flex w-full items-center justify-center gap-3 px-6 py-4 text-base font-bold press-[0.97] disabled:opacity-60"
            style={{ borderRadius: 'var(--radius-pill)' }}
          >
            <span>{unavailable ? 'ناموجود' : 'افزودن به سفارش'}</span>
            {!unavailable && (
              <>
                <span className="h-4 w-px bg-[color:color-mix(in_oklab,var(--on-accent)_25%,transparent)]" aria-hidden="true" />
                <Price value={unitPrice * quantity} size="cta" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Cart bar ─────────────────────────────────────────────────────────── */

function CartBar({ cart }: { cart: CartView }) {
  const visible = cart.count > 0

  return (
    <div
      className={`safe-b pointer-events-none fixed inset-x-0 top-0 z-40 flex h-[100dvh] items-end justify-center px-4 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-live="polite"
    >
      <button
        data-cta="open-cart"
        onClick={cart.open}
        disabled={!visible}
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className={`muse-glass muse-lit pointer-events-auto flex w-full max-w-md items-center gap-3 px-3 py-2.5 ps-3 press-[0.97] ${visible ? 'translate-y-0' : 'translate-y-8'}`}
        style={{ borderRadius: 'var(--radius-pill)' }}
      >
        <span
          className="muse-pop grid size-12 shrink-0 place-items-center"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, var(--accent-soft), var(--accent-deep))',
          }}
        >
          <span key={cart.count} className="cart-count tnum text-lg font-bold text-[color:var(--on-accent)]">
            {cart.count.toLocaleString('fa-IR', { useGrouping: false })}
          </span>
        </span>

        <span className="flex-1 text-start text-sm text-[color:var(--text-dim)]">
          {cart.count.toLocaleString('fa-IR', { useGrouping: false })} آیتم در سفارش
        </span>

        <Price value={cart.total} className="text-[color:var(--accent-soft)]" />

        <span
          className="grid size-10 shrink-0 place-items-center"
          style={{ borderRadius: 'var(--radius-pill)', background: 'color-mix(in oklab, var(--text) 10%, transparent)' }}
        >
          {Icon.chevronStart}
        </span>
      </button>
    </div>
  )
}

/* ── Cart sheet ───────────────────────────────────────────────────────── */

function CartSheet({ cart }: { cart: CartView }) {
  useOverlay(cart.isOpen, cart.close)
  const { mounted } = usePresence(cart.isOpen)
  if (!mounted) return null

  return (
    <div data-state={cart.isOpen ? 'open' : 'closing'} className="fixed inset-x-0 top-0 z-50 flex h-[100dvh] items-end justify-center sm:items-center">
      <button
        aria-label="بستن"
        onClick={cart.close}
        className="muse-fade absolute inset-0 bg-[color:color-mix(in_oklab,var(--bg)_78%,transparent)] backdrop-blur-md"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="سفارش شما"
        className="muse-sheet muse-glass relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden"
        style={{ borderRadius: 'var(--radius-lg)' }}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-6 pb-5 text-center">
          <button
            onClick={cart.close}
            aria-label="بستن"
            className="muse-glass order-2 grid size-10 shrink-0 place-items-center rounded-full text-[color:var(--text)] press-0.90"
          >
            {Icon.close}
          </button>
          <div className="order-1 flex-1">
            <h2 className="font-display text-3xl leading-none font-light text-[color:var(--text)]">
              سفارش شما
            </h2>
            <p className="mt-1.5 text-xs text-[color:var(--text-mute)]">میز شماره ۸ · پیش‌نمایش</p>
            <div className="mt-3 flex justify-center">
              <Flourish />
            </div>
          </div>
        </div>

        {cart.lines.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-2xl font-light text-[color:var(--text)]">سبد شما خالی است</p>
            <p className="mt-3 text-sm text-[color:var(--text-mute)]">از منو یک آیتم انتخاب کنید.</p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2">
              {cart.lines.map((line, index) => (
                <div
                  key={line.key}
                  data-removing={cart.removingKey === line.key} className="muse-rise flex items-center gap-3 border-b border-[color:var(--line)] py-3.5 last:border-0"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <img
                    src={`/images/${line.image}-sm.webp`}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="muse-photo size-14 shrink-0 object-cover"
                    style={{ borderRadius: '1rem 1rem 0.5rem 0.5rem' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[color:var(--text)]">{line.name}</p>
                    {line.selected.length > 0 && (
                      <p className="mt-0.5 truncate text-[0.72rem] text-[color:var(--text-mute)]">
                        {line.selected.map((c) => c.label).join(' · ')}
                      </p>
                    )}
                    <Price
                      value={line.unitPrice}
                      size="sm"
                      className="mt-1 text-[color:var(--accent-soft)]"
                    />
                  </div>

                  <button
                    onClick={() => cart.remove(line.key)}
                    aria-label={`حذف ${line.name}`}
                    className="muse-remove grid size-9 shrink-0 place-items-center rounded-full"
                  >
                    {Icon.trash}
                  </button>

                  <div className="muse-glass flex shrink-0 items-center gap-1 rounded-full p-1">
                    <button
                      onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                      aria-label="کاهش"
                      className="muse-step grid size-8 place-items-center rounded-full text-[color:var(--text-dim)]"
                    >
                      {Icon.minus}
                    </button>
                    <span className="tnum w-6 text-center text-sm font-semibold">
                      {line.quantity.toLocaleString('fa-IR', { useGrouping: false })}
                    </span>
                    <button
                      onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                      aria-label="افزایش"
                      className="muse-step grid size-8 place-items-center rounded-full text-[color:var(--text-dim)]"
                    >
                      {Icon.plus}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="safe-b shrink-0 px-6 pt-4">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm text-[color:var(--text-dim)]">جمع کل</span>
                <Price value={cart.total} size="xl" className="text-[color:var(--accent-soft)]" />
              </div>
              <button
                className="muse-cta muse-cta-sheen flex w-full items-center justify-center px-6 py-4 text-base font-bold press-[0.97]"
                style={{ borderRadius: 'var(--radius-pill)' }}
                onClick={cart.close}
              >
                ادامه‌ی منو
              </button>
              <p className="mt-4 text-center text-[0.72rem] text-[color:var(--text-mute)]">
                ثبت نهایی سفارش در نسخه‌ی نمایشی فعال نیست.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Footer ───────────────────────────────────────────────────────────── */

function Footer({ venue }: VenueProps) {
  return (
    <footer className="px-5 pt-8 pb-32 text-center sm:px-8">
      <div className="mx-auto max-w-md">
        <div className="flex justify-center">
          <Flourish />
        </div>
        <Latin className="mt-6 font-display text-3xl tracking-[0.3em] text-[color:var(--accent-soft)] ps-[0.3em]">
          {venue.latin}
        </Latin>
        <p className="mt-4 text-xs leading-relaxed text-[color:var(--text-mute)]">
          {venue.descriptor} · {venue.location}
          <br />
          برای ثبت سفارش، دسترسی میز توسط کارکنان تأیید می‌شود.
        </p>
      </div>
    </footer>
  )
}

/* ── Registration ─────────────────────────────────────────────────────── */

export const museTheme: Theme = {
  id: 'muse',
  name: 'مهتاب',
  latin: 'MUSE',
  descriptor: 'خیال‌انگیز · رؤیایی',
  pitch: 'میدان رنگی متحرک، کاشی‌های قوسی، و نرم‌ترین حرکت مجموعه — با ثبت لوکس.',
  swatch: ['#1b1226', '#e79bd0'],
  scope: 'muse',
  css: '',
  slots: {
    Backdrop,
    Hero,
    CategoryNav,
    CategorySection,
    ProductCard,
    SignatureCard,
    ProductSheet,
    CartBar,
    CartSheet,
    Footer,
  },
}