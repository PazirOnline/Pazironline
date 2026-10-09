import { useEffect, useMemo, useRef, useState } from 'react'
import type { Category, Product, Section } from '../types/catalog'
import type { CartView, ProductSheetView, Theme } from '../types/theme'
import { Icon, Latin, OptionChoices, Price, VariantRows, useOverlay, usePresence, useVariantSelection, variantChoice } from '../lib/ui'
import { hashUnit, imageSrc, imageSrcSet, stagger } from '../lib/media'
import './pulse.css'

type VenueProps = { venue: import('../types/catalog').Venue }


/**
 * PULSE — Theme 05. Urban / Bold / Dynamic.
 *
 * The structural bet: typography and geometry carry the weight, not imagery.
 * A huge condensed display line sets the pace, categories are numbered like a
 * menu index, cards use asymmetric grids with alternating offset, imagery is
 * aggressively cropped, and motion is directional and fast (things enter from
 * the side, scale hard, settle in ~250ms).
 *
 * Usability constraint (explicit in the brief): every touch target stays at
 * least 44px, the cart bar remains a single-thumb-reachable bar, and the
 * whole Menu → Product → Cart → Order path is unchanged.
 */

/* ── Backdrop ─────────────────────────────────────────────────────────── */

function Backdrop() {
  return (
    <>
      <div className="pulse-wash" aria-hidden="true" />
      <div className="pulse-grain" aria-hidden="true" />
    </>
  )
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

function Hero({ venue }: VenueProps) {
  return (
    <header className="pulse-slide relative overflow-hidden px-5 pt-10 pb-8 sm:px-8 sm:pt-14">
      <div className="mx-auto max-w-4xl">
        {/* Cover band sits behind the display type, cropped hard. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72 overflow-hidden sm:h-96">
          <img
            src={`/images/${venue.cover}-lg.webp`}
            alt=""
            aria-hidden="true"
            className="pulse-photo h-full w-full object-cover"
            style={{ opacity: 'var(--hero-photo-opacity)' }}
            loading="eager"
            decoding="async"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in oklab, var(--bg) 55%, transparent), var(--bg) 92%)',
            }}
          />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="pulse-label text-[color:var(--accent)]">{venue.status}</span>
            <span className="h-px flex-1 bg-[color:var(--line)]" aria-hidden="true" />
            <span className="pulse-label text-[color:var(--text-mute)]">{venue.location}</span>
          </div>

          {/* Display line. Latin only — Persian at this weight would be a wall. */}
          <h1 className="mt-6">
            <Latin className="pulse-display block text-[color:var(--accent)]">{venue.latin}</Latin>
            <span className="mt-2 block text-2xl leading-none font-black tracking-tight text-[color:var(--text)] sm:text-3xl">
              {venue.name}
            </span>
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="text-sm text-[color:var(--text-dim)]">{venue.descriptor}</p>
            <p className="pulse-label text-[color:var(--text-mute)]">{venue.tagline}</p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <span className="pulse-index text-5xl text-[color:var(--text-mute)] opacity-40 sm:text-6xl">
              {venue.monogram}
            </span>
            <div className="h-10 w-px bg-[color:var(--line-strong)]" aria-hidden="true" />
            <span className="pulse-label text-[color:var(--text-dim)]">منو · Menu · ۲۲ آیتم</span>
          </div>
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
      <div className="pulse-bar">
        {/* Mirrors the section wrapper: full-bleed padding on the outside, the
            rail centred to the same column width as the menu below it. */}
        <div className="px-5 sm:px-8">
        <div
          ref={railRef}
          className="no-scrollbar rail mx-auto w-full max-w-4xl items-stretch gap-0"
          role="tablist"
          aria-label="دسته‌بندی منو"
        >
          {categories.map((category, index) => {
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
                className={`pulse-chip relative flex shrink-0 snap-start flex-col justify-center px-4 py-2.5 ${
                  index > 0 ? 'border-e border-[color:var(--line)]' : ''
                }`}
              >
                <span className="pulse-label text-[0.5rem] opacity-60">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm leading-tight">{category.name}</span>
                {isActive && (
                  <span
                    className="pulse-wipe absolute inset-x-0 bottom-0 h-[3px] bg-[color:var(--accent)]"
                    aria-hidden="true"
                  />
                )}
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
  // Alternate crops so the grid is not a repeating stamp. Derived from the id,
  // which keeps it stable across re-renders without the slot needing an index.
  const tight = hashUnit(product.id) > 0.5

  return (
    <button
      onClick={() => onOpen(product)}
      aria-disabled={unavailable}
      className={`pulse-card pulse-edge group relative flex w-full flex-col overflow-hidden bg-[color:var(--surface)] text-start press-[0.99] ${
        unavailable ? 'opacity-60' : ''
      }`}
    >
      <div
        className={`relative w-full shrink-0 overflow-hidden bg-[color:var(--surface-2)] ${
          tight ? 'aspect-[5/4]' : 'aspect-square'
        }`}
      >
        {broken ? (
          <span className="media-fallback h-full w-full text-[0.7rem]">
            {product.latinName ?? product.name}
          </span>
        ) : (
          <img
            src={imageSrc(product, 'sm')}
            srcSet={imageSrcSet(product)}
            sizes="(max-width: 640px) 45vw, 240px"
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setBroken(true)}
            className={`pulse-photo h-full w-full object-cover ${loaded ? '' : 'scale-105 blur-sm'}`}
          />
        )}
        <div className="pulse-scrim absolute inset-0" />

        {/* Hard accent corner mark — the card's only ornament. */}
        <span
          className="absolute top-0 end-0 size-0 border-s-[18px] border-t-[18px] border-s-transparent border-t-[color:var(--accent)]"
          aria-hidden="true"
        />

        {unavailable && (
          <span className="pulse-sold-out absolute top-2 end-2 px-2 py-0.5 text-[0.6rem] font-bold">
            ناموجود
          </span>
        )}
        {!unavailable && product.badge && (
          <span className="absolute top-2 end-2 bg-[color:var(--accent)] px-2 py-0.5 text-[0.58rem] font-bold text-[color:var(--on-accent)]">
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <h3 className="line-clamp-2 text-[0.95rem] leading-tight font-bold text-[color:var(--text)]">
          {product.name}
        </h3>
        {product.latinName && (
          <Latin className="block truncate text-[0.58rem] tracking-[0.16em] text-[color:var(--text-mute)] uppercase">
            {product.latinName}
          </Latin>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <Price
            value={product.price}
            className="text-[0.95rem] font-bold text-[color:var(--accent)]"
          />
          {!unavailable && (
            <span className="pulse-add grid size-8 shrink-0 place-items-center" aria-hidden="true">
              {Icon.plus}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ── Signature card ───────────────────────────────────────────────────── */

/** Full-bleed poster: no border, no radius, image as the whole panel. */
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
      className="pulse-card group relative flex h-full w-full flex-col overflow-hidden bg-[color:var(--surface)] text-start press-[0.98]"
    >
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-[color:var(--surface-2)]">
        {broken ? (
          <span className="media-fallback h-full w-full text-[0.7rem]">
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
            className={`pulse-photo h-full w-full object-cover ${loaded ? '' : 'scale-105 blur-sm'}`}
          />
        )}
        <div className="pulse-scrim absolute inset-0" />

        {/* Hard accent block behind the price. */}
        <span
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background:
              'linear-gradient(to top, color-mix(in oklab, var(--bg) 94%, transparent), transparent)',
          }}
          aria-hidden="true"
        />

        {product.badge && (
          <span className="absolute top-3 start-3 bg-[color:var(--accent)] px-2 py-0.5 text-[0.58rem] font-bold text-[color:var(--on-accent)]">
            {product.badge}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-lg leading-none font-black text-[color:var(--text)]">{product.name}</h3>
          <p className="mt-2 line-clamp-2 text-[0.78rem] leading-relaxed text-[color:var(--text-dim)]">
            {product.description}
          </p>
          <div className="mt-3">
            <Price value={product.price} className="text-lg font-bold text-[color:var(--accent)]" />
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
  const number = categoriesIndex(category.id)

  return (
    <section
      id={`section-${category.id}`}
      aria-labelledby={`heading-${category.id}`}
      className="scroll-mt-20 px-5 py-8 sm:px-8 sm:py-12"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-end gap-4">
          <span className="pulse-index text-5xl text-[color:var(--accent)] sm:text-6xl">
            {String(number).padStart(2, '0')}
          </span>
          <div className="min-w-0 flex-1 pb-1">
            <h2
              id={`heading-${category.id}`}
              className="text-xl leading-none font-black text-[color:var(--text)] sm:text-2xl"
            >
              {category.name}
            </h2>
            <Latin className="pulse-label mt-1.5 block text-[color:var(--text-mute)]">
              {category.latin}
            </Latin>
          </div>
          <span className="pulse-label shrink-0 pb-1 text-[color:var(--text-mute)]">
            {String(items.length).padStart(2, '0')} آیتم
          </span>
        </div>

        <div className="h-0.5 w-full bg-[color:var(--accent)]" aria-hidden="true" />

        {/* Two columns, offset — the second column drops down to break the grid. */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {items.map((product, i) => (
            <div
              key={product.id}
              className={`pulse-slam ${i % 2 === 1 ? 'lg:mt-8' : ''}`}
              style={{ animationDelay: `${stagger(i, 35)}ms` }}
            >
              <ProductCard product={product} onOpen={onOpen} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Stable category numbering from the id, matching the nav order. */
function categoriesIndex(id: string): number {
  const order = ['hot', 'cold', 'special', 'bakery', 'dessert', 'breakfast']
  const found = order.indexOf(id)
  return (found === -1 ? 0 : found) + 1
}

/* ── Product sheet ────────────────────────────────────────────────────── */

function ProductSheet({ product, onClose, onAdd, state }: ProductSheetView) {
  const [quantity, setQuantity] = useState(1)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setQuantity(1)
    setBroken(false)
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
        className="pulse-fade absolute inset-0 bg-[color:color-mix(in_oklab,var(--bg)_80%,transparent)]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="pulse-sheet pulse-glass relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden"
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[color:var(--surface-2)]">
          {broken ? (
            <span className="media-fallback h-full w-full text-sm">{product.name}</span>
          ) : (
            <img
              src={imageSrc(product, 'lg')}
              alt={product.name}
              decoding="async"
              onError={() => setBroken(true)}
              className="pulse-photo h-full w-full object-cover"
            />
          )}
          <div className="pulse-scrim absolute inset-0" />
          <button
            onClick={onClose}
            aria-label="بستن"
            className="absolute top-3 end-3 grid size-11 place-items-center border border-[color:var(--line-strong)] bg-[color:color-mix(in_oklab,var(--bg)_70%,transparent)] transition-colors hover:bg-[color:var(--bg)]"
          >
            {Icon.close}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-4">
          <div className="flex items-baseline justify-between gap-4">
            {product.latinName ? (
              <Latin className="pulse-label text-[color:var(--accent)]">{product.latinName}</Latin>
            ) : (
              <span />
            )}
            <Price value={product.price} size="lg" className="font-bold text-[color:var(--accent)]" />
          </div>

          <h2 className="mt-3 text-2xl leading-none font-black text-[color:var(--text)] sm:text-3xl">
            {product.name}
          </h2>

          <div className="mt-4 h-[3px] w-14 bg-[color:var(--accent)]" aria-hidden="true" />

          <p className="mt-4 text-[0.92rem] leading-relaxed text-[color:var(--text-dim)]">
            {product.description}
          </p>

          {unavailable && (
            <div className="pulse-sold-out mt-5 px-4 py-3 text-sm font-bold">
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
                choiceClassName="pulse-choice rounded-none"
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
              rowClassName="pulse-glass"
              selectedRowClassName="pulse-glass ring-1 ring-[color:var(--accent)]"
              addClassName="pulse-cta"
            />
          )}

        </div>

        <div className="safe-b shrink-0 border-t border-[color:var(--line-strong)] px-5 pt-4">
          {!unavailable && (
            <div className="mb-4 flex items-center justify-between">
              <span className="pulse-label text-[color:var(--text-mute)]">تعداد · Qty</span>
              <div className="flex items-center border border-[color:var(--line-strong)]">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="کاهش تعداد"
                  className="pulse-step grid size-11 place-items-center disabled:opacity-30"
                >
                  {Icon.minus}
                </button>
                <span className="tnum w-10 border-x border-[color:var(--line-strong)] text-center text-base font-bold">
                  {quantity.toLocaleString('fa-IR', { useGrouping: false })}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  aria-label="افزایش تعداد"
                  className="pulse-step grid size-11 place-items-center"
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
            className="pulse-cta press-0.96 flex w-full items-center justify-between gap-3 px-5 py-4 text-base font-black disabled:opacity-50"
          >
            <span>{unavailable ? 'ناموجود' : 'افزودن به سفارش'}</span>
            {!unavailable && <Price value={unitPrice * quantity} size="cta" className="font-black" />}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Cart bar ─────────────────────────────────────────────────────────── */

/** A hard bar docked to the bottom with a hard accent edge. */
function CartBar({ cart }: { cart: CartView }) {
  const visible = cart.count > 0

  return (
    <div
      className={`safe-b pointer-events-none fixed inset-x-0 top-0 z-40 flex h-[100dvh] flex-col justify-end transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-live="polite"
    >
      <div
        className={`border-t-2 border-[color:var(--accent)] bg-[color:color-mix(in_oklab,var(--surface)_94%,transparent)] backdrop-blur-md transition-transform duration-200 ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <button
          data-cta="open-cart"
          onClick={cart.open}
          disabled={!visible}
          tabIndex={visible ? 0 : -1}
          aria-hidden={!visible}
          className="pointer-events-auto mx-auto flex w-full max-w-4xl items-center gap-3 px-5 py-3 text-start transition-colors duration-150 active:bg-[color:color-mix(in_oklab,var(--accent)_14%,transparent)]"
        >
          <span className="grid size-11 shrink-0 place-items-center bg-[color:var(--accent)]">
            <span key={cart.count} className="cart-count tnum text-base font-black text-[color:var(--on-accent)]">
              {cart.count.toLocaleString('fa-IR', { useGrouping: false })}
            </span>
          </span>
          <span className="min-w-0 flex-1 text-sm font-bold text-[color:var(--text)]">
            سفارش شما
          </span>
          <Price value={cart.total} className="font-bold text-[color:var(--accent)]" />
          <span className="shrink-0" aria-hidden="true">
            {Icon.chevronStart}
          </span>
        </button>
      </div>
    </div>
  )
}

/* ── Cart sheet: full-bleed takeover ──────────────────────────────────── */

function CartSheet({ cart }: { cart: CartView }) {
  useOverlay(cart.isOpen, cart.close)
  const { mounted } = usePresence(cart.isOpen)
  if (!mounted) return null

  return (
    <div data-state={cart.isOpen ? 'open' : 'closing'} className="fixed inset-x-0 top-0 z-50 h-[100dvh]">
      <button
        aria-label="بستن"
        onClick={cart.close}
        className="pulse-fade absolute inset-0 bg-[color:color-mix(in_oklab,var(--bg)_82%,transparent)]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="سفارش شما"
        className="pulse-sheet pulse-glass absolute inset-0 flex flex-col overflow-hidden sm:inset-y-6 sm:inset-x-auto sm:end-6 sm:w-full sm:max-w-md"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b-2 border-[color:var(--accent)] px-5 py-4">
          <h2 className="text-lg leading-none font-black text-[color:var(--text)]">سفارش شما</h2>
          <span className="pulse-label text-[color:var(--text-mute)]">میز ۸ · پیش‌نمایش</span>
          <button
            onClick={cart.close}
            aria-label="بستن"
            className="grid size-11 shrink-0 place-items-center border border-[color:var(--line-strong)] transition-colors hover:bg-[color:color-mix(in_oklab,var(--text)_10%,transparent)]"
          >
            {Icon.close}
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="grid flex-1 place-items-center px-6 py-20 text-center">
            <div>
              <p className="text-lg font-black text-[color:var(--text)]">سبد خالی</p>
              <p className="mt-2 text-sm text-[color:var(--text-mute)]">از منو یک آیتم انتخاب کنید.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {cart.lines.map((line, i) => (
                <div
                  key={line.key}
                  data-removing={cart.removingKey === line.key} className="pulse-slide flex items-center gap-3 border-b border-[color:var(--line)] px-5 py-3.5"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <img
                    src={`/images/${line.image}-sm.webp`}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="pulse-photo size-14 shrink-0 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[color:var(--text)]">{line.name}</p>
                    {line.selected.length > 0 && (
                      <p className="mt-0.5 truncate text-[0.72rem] text-[color:var(--text-mute)]">
                        {line.selected.map((c) => c.label).join(' · ')}
                      </p>
                    )}
                    <Price
                      value={line.unitPrice}
                      size="sm"
                      className="mt-1 font-bold text-[color:var(--accent)]"
                    />
                  </div>

                  <button
                    onClick={() => cart.remove(line.key)}
                    aria-label={`حذف ${line.name}`}
                    className="pulse-remove grid size-11 shrink-0 place-items-center"
                  >
                    {Icon.trash}
                  </button>

                  <div className="flex shrink-0 items-center border border-[color:var(--line-strong)]">
                    <button
                      onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                      aria-label="کاهش"
                      className="pulse-step grid size-10 place-items-center"
                    >
                      {Icon.minus}
                    </button>
                    <span className="tnum w-7 text-center text-sm font-black">
                      {line.quantity.toLocaleString('fa-IR', { useGrouping: false })}
                    </span>
                    <button
                      onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                      aria-label="افزایش"
                      className="pulse-step grid size-10 place-items-center"
                    >
                      {Icon.plus}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="safe-b shrink-0 border-t-2 border-[color:var(--accent)] px-5 pt-4">
              <div className="mb-4 flex items-end justify-between">
                <span className="pulse-label text-[color:var(--text-mute)]">جمع کل · Total</span>
                <Price value={cart.total} size="xl" className="font-black text-[color:var(--accent)]" />
              </div>
              <button
                className="pulse-cta flex w-full items-center justify-between px-5 py-4 text-base font-black"
                onClick={cart.close}
              >
                <span>ادامه‌ی منو</span>
                {Icon.arrowUp}
              </button>
              <p className="mt-3 text-center text-[0.7rem] text-[color:var(--text-mute)]">
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
    <footer className="px-5 pt-10 pb-28 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="h-0.5 w-16 bg-[color:var(--accent)]" aria-hidden="true" />
        <Latin className="pulse-display mt-5 block text-[color:var(--text)] opacity-90">
          {venue.latin}
        </Latin>
        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
          <p className="pulse-label text-[color:var(--text-mute)]">
            {venue.descriptor} · {venue.location}
          </p>
        </div>
        <p className="mt-4 text-[0.72rem] leading-relaxed text-[color:var(--text-mute)]">
          برای ثبت سفارش، دسترسی میز توسط کارکنان تأیید می‌شود.
        </p>
      </div>
    </footer>
  )
}

/* ── Registration ─────────────────────────────────────────────────────── */

export const pulseTheme: Theme = {
  id: 'pulse',
  name: 'تپش',
  latin: 'PULSE',
  descriptor: 'شهری · پویا',
  pitch: 'تایپوگرافی درشت و هندسه‌ی تیز؛ رنگ اسیدی، برش‌های تند و حرکت جهت‌دار.',
  swatch: ['#08080a', '#d8ff3e'],
  scope: 'pulse',
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