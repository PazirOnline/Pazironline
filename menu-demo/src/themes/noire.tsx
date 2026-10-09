import { useEffect, useMemo, useRef, useState } from 'react'
import type { Category, Product, Section } from '../types/catalog'
import type {
  CartView,
  ProductSheetView,
  Theme,
} from '../types/theme'
import { Icon, Latin, OptionChoices, Price, VariantRows, useOverlay, usePresence, useVariantSelection, variantChoice } from '../lib/ui'
import { imageSrc, imageSrcSet, stagger } from '../lib/media'
import './noire.css'

type VenueProps = { venue: import('../types/catalog').Venue }


/**
 * NOIRÉ — the flagship theme, ported from the original single-theme build with
 * its visual decisions intact: warm-espresso base, one restrained gold accent,
 * photography as the only loud element, glass in three depths, editorial display
 * type. What changed is only that tokens now come from CSS and slots are
 * registered rather than hard-wired into App.
 */

/* ── Backdrop ─────────────────────────────────────────────────────────── */

function Backdrop() {
  return (
    <>
      <div
        className="animate-fade fixed inset-0 -z-10 pointer-events-none"
        aria-hidden="true"
        style={{
          background: [
            'radial-gradient(120% 70% at 78% -8%, color-mix(in oklab, var(--accent) 26%, transparent) 0%, transparent 58%)',
            'radial-gradient(90% 55% at 12% 4%, color-mix(in oklab, #6b3f22 40%, transparent) 0%, transparent 62%)',
            'radial-gradient(120% 90% at 50% 108%, color-mix(in oklab, #241a12 70%, transparent) 0%, transparent 60%)',
            'linear-gradient(180deg, #100d0a 0%, #080706 55%, #060504 100%)',
          ].join(','),
        }}
      />
      <div className="noire-grain" aria-hidden="true" />
    </>
  )
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

function Hero({ venue }: VenueProps) {
  return (
    <header className="noire-rise relative overflow-hidden">
      {/* Ambient backdrop, heavily softened so it never competes with the food. */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src={`/images/${venue.cover}-lg.webp`}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-110 object-cover blur-[2px]"
          style={{ opacity: 'var(--hero-photo-opacity)' }}
          loading="eager"
          decoding="async"
        />
        <div className="noire-hero-scrim absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_70%_0%,rgba(211,168,95,0.22),transparent_70%)]" />
      </div>

      <div className="relative px-5 pt-10 pb-8 sm:px-8 sm:pt-14 sm:pb-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="relative">
            <div
              className="absolute inset-0 -z-10 rounded-full blur-2xl"
              style={{ background: 'color-mix(in oklab, var(--accent) 25%, transparent)' }}
              aria-hidden="true"
            />
            <div className="noire-glass-2 noir-sheen relative flex size-16 items-center justify-center overflow-hidden rounded-full sm:size-[4.5rem]">
              <Latin className="font-display text-3xl leading-none font-light text-[color:var(--accent-soft)] sm:text-4xl">
                {venue.monogram}
              </Latin>
            </div>
          </div>

          <h1 className="mt-5 flex flex-col items-center gap-1.5">
            <Latin className="noire-gradient-text ps-[0.42em] font-display text-[2.1rem] leading-none font-light tracking-[0.42em] sm:text-5xl">
              {venue.latin}
            </Latin>
            <span className="text-lg font-medium tracking-wide text-[color:color-mix(in_oklab,var(--text)_95%,var(--accent)_5%)] sm:text-xl">
              {venue.name}
            </span>
          </h1>

          <p className="mt-3 text-[0.95rem] text-[color:var(--text-dim)]">{venue.descriptor}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="noire-glass-1 flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-[color:color-mix(in_oklab,var(--text)_88%,transparent)]">
              <span className="relative flex size-2">
                <span className="noire-live absolute inline-flex size-full rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              {venue.status}
            </span>
            <span className="noire-glass-1 rounded-full px-3.5 py-1.5 text-xs text-[color:var(--text-dim)]">
              {venue.location}
            </span>
          </div>

          <p className="mt-5 text-sm text-[color:var(--text-mute)]">{venue.tagline}</p>
        </div>
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

  // Keep the active chip in view inside the rail.
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
      <div className="noire-bar">
        {/* Mirrors the section wrapper: full-bleed padding on the outside, the
            rail centred to the same column width as the menu below it. Without
            this the chips hug the viewport edge and drift away from the content
            by a few hundred pixels on desktop. */}
        <div className="px-5 sm:px-8">
        <div
          ref={railRef}
          className="no-scrollbar rail mx-auto h-[3.75rem] w-full max-w-3xl items-center gap-2"
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
onClick={() => {
                  document
                    .getElementById(`section-${category.id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  onSelect(category.id)
                }}
                data-selected={isActive}
                className={`noire-chip relative shrink-0 snap-start rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                  isActive
                    ? 'font-medium'
                    : 'noire-glass-1 text-[color:color-mix(in_oklab,var(--text)_88%,transparent)] press-0.95'
                }`}
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

  return (
    <button
      onClick={() => onOpen(product)}
      aria-disabled={unavailable}
      className={`noire-rise group relative flex w-full flex-col overflow-hidden rounded-3xl text-start press-[0.98] ${
        unavailable ? 'opacity-55' : ''
      }`}
      style={{ boxShadow: 'var(--shadow-lift)' }}
    >
      <div className="relative aspect-[5/4] w-full shrink-0 overflow-hidden bg-[color:var(--surface)]">
        {broken ? (
          <span className="media-fallback h-full w-full font-display text-2xl">
            {product.latinName ?? product.name}
          </span>
        ) : (
          <img
            src={imageSrc(product, 'sm')}
            srcSet={imageSrcSet(product)}
            sizes="(max-width: 640px) 90vw, 320px"
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setBroken(true)}
            className={`noire-photo h-full w-full object-cover ${loaded ? '' : 'blur-sm'} group-active:scale-[1.05]`}
          />
        )}
        <div className="noire-scrim absolute inset-0" />
      </div>

      <div className="relative flex flex-1 flex-col gap-1.5 p-4 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[0.98rem] leading-snug font-semibold text-[color:var(--text)]">
              {product.name}
            </h3>
            {product.latinName && (
              <Latin className="mt-0.5 block truncate text-[0.68rem] tracking-[0.18em] text-[color:var(--text-mute)] uppercase">
                {product.latinName}
              </Latin>
            )}
          </div>

          {unavailable ? (
            <span className="shrink-0 rounded-full border border-[color:var(--text-mute)] px-2.5 py-1 text-[0.65rem] text-[color:var(--text-dim)]">
              ناموجود
            </span>
          ) : (
            product.badge && (
              <span className="shrink-0 rounded-full bg-[color:color-mix(in_oklab,var(--accent)_15%,transparent)] px-2.5 py-1 text-[0.65rem] text-[color:var(--accent-soft)]">
                {product.badge}
              </span>
            )
          )}
        </div>

        <p className="line-clamp-2 text-[0.8rem] leading-relaxed text-[color:var(--text-dim)]">
          {product.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <Price value={product.price} className="text-[color:var(--accent-soft)]" />
          {!unavailable && (
            <span
              className="noire-add flex size-9 shrink-0 items-center justify-center rounded-full text-[color:color-mix(in_oklab,var(--text)_95%,var(--accent)_5%)]"
              aria-hidden="true"
            >
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
      className="noire-rise group relative isolate flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] text-start press-[0.985]"
      style={{ boxShadow: 'var(--shadow-lift)' }}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[color:var(--surface)] sm:aspect-[4/5]">
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
            className={`noire-photo h-full w-full object-cover ${
              loaded ? 'scale-100' : 'scale-105 blur-sm'
            } group-active:scale-[1.04]`}
          />
        )}
        <div className="noire-scrim absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, var(--bg) 0%, color-mix(in oklab, var(--bg) 45%, transparent) 55%, transparent 100%)',
          }}
        />

        {/* Top sheen: sells the glass as a material */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(to left, transparent, color-mix(in oklab, var(--text) 35%, transparent), transparent)',
          }}
          aria-hidden="true"
        />

        {product.badge && (
          <span className="noire-glass-2 absolute top-3 end-3 max-w-[80%] truncate rounded-full px-2.5 py-1 text-[0.6rem] font-medium text-[color:var(--accent-100)] sm:top-4 sm:end-4 sm:px-3 sm:text-[0.7rem]">
            {product.badge}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5">
          {product.latinName && (
            <Latin className="mb-1 block truncate text-[0.58rem] tracking-[0.2em] text-[color:var(--accent)] uppercase sm:text-[0.68rem] sm:tracking-[0.28em]">
              {product.latinName}
            </Latin>
          )}
          <h3 className="line-clamp-2 text-[0.98rem] leading-tight font-semibold text-[color:var(--text)] sm:text-xl">
            {product.name}
          </h3>
          <p className="mt-1.5 hidden text-sm leading-relaxed text-[color:color-mix(in_oklab,var(--text)_85%,transparent)] sm:line-clamp-2 sm:block">
            {product.description}
          </p>
          <div className="mt-2.5 sm:mt-4">
            <Price value={product.price} className="text-[color:var(--accent-soft)] sm:text-lg" />
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
      className="scroll-mt-24 px-5 py-9 sm:px-8 sm:py-12"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2
            id={`heading-${category.id}`}
            className="flex flex-col gap-1 text-xl font-bold text-[color:var(--text)] sm:text-2xl"
          >
            <span>{category.name}</span>
            <Latin className="text-[0.68rem] font-normal tracking-[0.34em] text-[color:var(--accent)] uppercase">
              {category.latin}
            </Latin>
          </h2>
          <div
            className="h-px flex-1"
            style={{
              background:
                'linear-gradient(to left, transparent, var(--line-strong), transparent)',
            }}
            aria-hidden="true"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((product, i) => (
            <div key={product.id} className="noire-rise" style={{ animationDelay: `${stagger(i)}ms` }}>
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

  // Reset whenever a different product opens.
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
        className="noire-fade absolute inset-0 bg-[color:color-mix(in_oklab,var(--bg)_80%,transparent)] backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="noire-sheet noire-glass-3 relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] sm:max-h-[88dvh] sm:rounded-[2rem]"
      >
        {/* Grab handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-[color:color-mix(in_oklab,var(--text)_25%,transparent)]" aria-hidden="true" />
        </div>

        <div className="relative aspect-[16/11] w-full shrink-0 overflow-hidden bg-[color:var(--surface)]">
          <img
            src={imageSrc(product, 'lg')}
            alt={product.name}
            decoding="async"
            className="noire-photo h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, var(--bg), color-mix(in oklab, var(--bg) 30%, transparent) 55%, transparent)',
            }}
          />
          <button
            onClick={onClose}
            className="noire-glass-2 absolute top-3 end-3 flex size-10 items-center justify-center rounded-full text-[color:color-mix(in_oklab,var(--text)_95%,var(--accent)_5%)] press-0.90"
            aria-label="بستن"
          >
            {Icon.close}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-4">
          {product.latinName && (
            <Latin className="mb-1 block text-[0.68rem] tracking-[0.34em] text-[color:var(--accent)] uppercase">
              {product.latinName}
            </Latin>
          )}
          <h2 className="text-2xl leading-tight font-bold text-[color:var(--text)]">{product.name}</h2>
          <p className="mt-3 text-[0.92rem] leading-relaxed text-[color:var(--text-dim)]">{product.description}</p>

          {unavailable && (
            <div className="noire-unavailable mt-4 rounded-2xl border border-[color:color-mix(in_oklab,var(--danger)_30%,transparent)] bg-[color:color-mix(in_oklab,var(--danger)_10%,transparent)] px-4 py-3 text-sm text-[color:color-mix(in_oklab,var(--text)_88%,transparent)]">
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
                className="mt-6"
                choiceClassName="noire-choice"
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
              className="mt-6"
              rowClassName="noire-glass-1"
              selectedRowClassName="noire-glass-2"
              addClassName="noire-cta"
            />
          )}

        </div>

        {/* Sticky action bar */}
        <div className="noire-glass-3 safe-b shrink-0 px-5 pt-4">
          {!unavailable && (
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-[color:var(--text-dim)]">تعداد</span>
              <div className="noire-glass-1 flex items-center gap-1 rounded-full p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="کاهش تعداد"
                  className="noire-step flex size-10 items-center justify-center rounded-full text-[color:color-mix(in_oklab,var(--text)_95%,var(--accent)_5%)] disabled:opacity-30"
                >
                  {Icon.minus}
                </button>
                <span className="tnum w-8 text-center text-base font-semibold">
                  {quantity.toLocaleString('fa-IR', { useGrouping: false })}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  aria-label="افزایش تعداد"
                  className="noire-step flex size-10 items-center justify-center rounded-full text-[color:color-mix(in_oklab,var(--text)_95%,var(--accent)_5%)]"
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
            className="noire-cta noir-cta-lg flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-bold press-[0.98] disabled:opacity-60"
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
        className={`noire-glass-3 pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-full px-3 py-2.5 ps-3 press-[0.98] ${visible ? 'translate-y-0' : 'translate-y-6'}`}
      >
        {/* The key lives on the wrapper, not on the two children: both the count
            and the notification dot are re-keyed on every change so their
            entrance animations replay. Sibling keys must be unique, so keying
            each child with cart.count collided and left a stale node behind. */}
        <span
          key={cart.count}
          className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--accent-soft)] to-[color:var(--accent-deep)]"
        >
          <span className="cart-count tnum text-lg font-bold text-[color:var(--on-accent)]">
            {cart.count.toLocaleString('fa-IR', { useGrouping: false })}
          </span>
          {visible && (
            <span
              className="noire-pop absolute -top-0.5 -end-0.5 size-3 rounded-full bg-[color:var(--text)] ring-2 ring-[color:var(--bg)]"
              aria-hidden="true"
            />
          )}
        </span>

        <span className="flex-1 text-start text-sm text-[color:color-mix(in_oklab,var(--text)_88%,transparent)]">
          {cart.count.toLocaleString('fa-IR', { useGrouping: false })} آیتم در سفارش
        </span>

        <Price value={cart.total} className="text-[color:var(--accent-soft)]" />

        <span className="noire-glass-1 flex size-10 shrink-0 items-center justify-center rounded-full">
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
        className="noire-fade absolute inset-0 bg-[color:color-mix(in_oklab,var(--bg)_80%,transparent)] backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="سفارش شما"
        className="noire-sheet noire-glass-3 relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[2rem]"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[color:var(--line)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--text)]">سفارش شما</h2>
            <p className="text-xs text-[color:var(--text-dim)]">میز شماره ۸ · پیش‌نمایش</p>
          </div>
          <button
            onClick={cart.close}
            aria-label="بستن"
            className="noire-glass-1 flex size-10 items-center justify-center rounded-full press-0.90"
          >
            {Icon.close}
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[color:var(--text-dim)]">سبد شما خالی است</p>
            <p className="mt-2 text-sm text-[color:var(--text-mute)]">از منو یک آیتم انتخاب کنید.</p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              {cart.lines.map((line) => (
                <div
                  key={line.key}
                  data-removing={cart.removingKey === line.key}
                  className="noire-line flex items-center gap-3 border-b border-[color:color-mix(in_oklab,var(--text)_6%,transparent)] py-3 last:border-0"
                >
                  <img
                    src={`/images/${line.image}-sm.webp`}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="noire-photo size-14 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[color:var(--text)]">{line.name}</p>
                    {line.selected.length > 0 && (
                      <p className="mt-0.5 truncate text-[0.72rem] text-[color:var(--text-dim)]">
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
                    className="noire-remove flex size-9 shrink-0 items-center justify-center rounded-full text-[color:var(--text-mute)]"
                  >
                    {Icon.trash}
                  </button>

                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-[color:color-mix(in_oklab,var(--text)_6%,transparent)] p-1">
                    <button
                      onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                      aria-label="کاهش"
                      className="noire-step flex size-8 items-center justify-center rounded-full text-[color:color-mix(in_oklab,var(--text)_88%,transparent)]"
                    >
                      {Icon.minus}
                    </button>
                    <span className="tnum w-6 text-center text-sm font-semibold">
                      {line.quantity.toLocaleString('fa-IR', { useGrouping: false })}
                    </span>
                    <button
                      onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                      aria-label="افزایش"
                      className="noire-step flex size-8 items-center justify-center rounded-full text-[color:color-mix(in_oklab,var(--text)_88%,transparent)]"
                    >
                      {Icon.plus}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="safe-b shrink-0 border-t border-[color:var(--line)] px-5 pt-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-[color:var(--text-dim)]">جمع کل</span>
                <Price value={cart.total} size="xl" className="text-[color:var(--accent-soft)]" />
              </div>
              <button
                className="noire-cta flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold press-[0.98]"
                onClick={cart.close}
              >
                ادامه‌ی منو
              </button>
              <p className="mt-3 text-center text-[0.72rem] text-[color:var(--text-mute)]">
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
    <footer className="px-5 pt-6 pb-32 text-center sm:px-8">
      <div className="mx-auto max-w-md">
        <div
          className="mx-auto h-px w-16"
          style={{
            background:
              'linear-gradient(to left, transparent, color-mix(in oklab, var(--accent) 60%, transparent), transparent)',
          }}
          aria-hidden="true"
        />
        <Latin className="mt-5 font-display text-2xl tracking-[0.35em] text-[color:color-mix(in_oklab,var(--accent)_80%,transparent)] ps-[0.35em]">
          {venue.latin}
        </Latin>
        <p className="mt-3 text-xs leading-relaxed text-[color:var(--text-mute)]">
          {venue.descriptor} · {venue.location}
          <br />
          برای ثبت سفارش، دسترسی میز توسط کارکنان تأیید می‌شود.
        </p>
      </div>
    </footer>
  )
}

/* ── Registration ─────────────────────────────────────────────────────── */

export const noirTheme: Theme = {
  id: 'noire',
  name: 'نواره',
  latin: 'NOIRÉ',
  descriptor: 'لوکس · تحریری',
  pitch: 'تم تیره، سینمایی و تحریری با تایپوگرافی مجله‌ای و طلایی کنترل‌شده.',
  swatch: ['#0c0a08', '#d3a85f'],
  flagship: true,
  scope: 'noire',
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