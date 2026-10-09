import { useEffect, useMemo, useRef, useState } from 'react'
import type { Category, Product, Section } from '../types/catalog'
import type { CartView, ProductSheetView, Theme } from '../types/theme'
import { Icon, Latin, OptionChoices, Price, VariantRows, useOverlay, usePresence, useVariantSelection, variantChoice } from '../lib/ui'
import { hashUnit, imageSrc, imageSrcSet, stagger } from '../lib/media'
import './verde.css'

type VenueProps = { venue: import('../types/catalog').Venue }


/**
 * VERDE — Theme 04. Organic / Natural / Cozy.
 *
 * The structural bet: warmth and hand-made irregularity. Warm paper ground
 * rather than white, sage and clay, corners where one edge is tucked rather
 * than uniformly round, and a botanical hairline used as a real section
 * divider. Photos are gently warmed, never darkened. Motion settles slowly
 * (no bounce) so it reads as growth rather than as UI theatre.
 */

/* ── Backdrop ─────────────────────────────────────────────────────────── */

function Backdrop() {
  return (
    <>
      <div className="verde-wash" aria-hidden="true" />
      <div className="verde-grain" aria-hidden="true" />
    </>
  )
}

function Stem({ withSprig = true }: { withSprig?: boolean }) {
  return (
    <div className="verde-stem" aria-hidden="true">
      {withSprig && (
        <span className="verde-sprig">
          <span />
          <span />
          <span />
        </span>
      )}
    </div>
  )
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

function Hero({ venue }: VenueProps) {
  return (
    <header className="verde-reveal relative overflow-hidden px-5 pt-12 pb-10 sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-3xl">
        {/* Cover sits in an arch above the name — a doorway into the café. */}
        <div className="relative mx-auto aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9] verde-cut">
          <img
            src={`/images/${venue.cover}-lg.webp`}
            alt=""
            aria-hidden="true"
            className="verde-photo h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="verde-scrim absolute inset-0" />
          <div
            className="absolute inset-x-0 bottom-0 p-5 sm:p-7"
            style={{
              background:
                'linear-gradient(to top, color-mix(in oklab, var(--surface) 94%, transparent), transparent)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <span className="verde-label inline-block rounded-full bg-[color:color-mix(in_oklab,var(--surface)_85%,transparent)] px-3 py-1 text-[0.65rem] text-[color:var(--accent-deep)]">
              {venue.status}
            </span>
          </div>
        </div>

        <div className="-mt-8 flex flex-col items-center px-2 text-center sm:-mt-10">
          <div
            className="verde-grow grid size-16 place-items-center rounded-full"
            style={{
              background: 'linear-gradient(to bottom, var(--surface), var(--surface-2))',
              boxShadow: 'var(--shadow-lift)',
            }}
          >
            <Latin className="font-display text-2xl leading-none font-light text-[color:var(--accent-deep)]">
              {venue.monogram}
            </Latin>
          </div>

          <h1 className="mt-5 flex flex-col items-center gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[color:var(--text)] sm:text-3xl">
              {venue.name}
            </span>
            <Latin className="text-sm tracking-[0.3em] text-[color:var(--accent)] uppercase">
              {venue.latin}
            </Latin>
          </h1>

          <p className="mt-3 text-[0.95rem] text-[color:var(--text-dim)]">{venue.descriptor}</p>

          <div className="mt-5 flex w-full max-w-xs items-center gap-3">
            <div className="h-px flex-1 bg-[color:var(--line)]" aria-hidden="true" />
            <p className="text-[0.8rem] text-[color:var(--text-mute)]">{venue.tagline}</p>
            <div className="h-px flex-1 bg-[color:var(--line)]" aria-hidden="true" />
          </div>

          <p className="mt-4 text-[0.75rem] text-[color:var(--text-mute)]">{venue.location}</p>
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
      <div className="verde-bar">
        {/* Mirrors the section wrapper: full-bleed padding on the outside, the
            rail centred to the same column width as the menu below it. */}
        <div className="px-5 sm:px-8">
        <div
          ref={railRef}
          className="no-scrollbar rail mx-auto w-full max-w-3xl items-center gap-2 py-3"
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
                className="verde-chip shrink-0 snap-start rounded-full px-4 py-2.5 text-sm transition-all duration-300"
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
  const breathe = 8 + hashUnit(product.id) * 4

  return (
    <button
      onClick={() => onOpen(product)}
      aria-disabled={unavailable}
      className="verde-unfurl group relative flex w-full flex-col overflow-hidden bg-[color:var(--surface)] text-start press-[0.99] verde-cut"
      style={{ boxShadow: 'var(--shadow-lift)' }}
    >
      <div
        className="aspect-[4/3] w-full shrink-0 overflow-hidden bg-[color:var(--surface-2)]"
        style={{ ['--breathe' as string]: `${breathe}s` }}
      >
        {broken ? (
          <span className="media-fallback h-full w-full font-display text-xl">
            {product.latinName ?? product.name}
          </span>
        ) : (
          <img
            src={imageSrc(product, 'sm')}
            srcSet={imageSrcSet(product)}
            sizes="(max-width: 640px) 90vw, 300px"
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setBroken(true)}
            className={`verde-photo h-full w-full object-cover ${loaded ? '' : 'scale-105 blur-sm'}`}
          />
        )}

        {product.badge && !unavailable && (
          <span className="absolute top-3 end-3 rounded-full bg-[color:color-mix(in_oklab,var(--surface)_88%,transparent)] px-3 py-1 text-[0.62rem] text-[color:var(--accent-deep)]">
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4 pb-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[1rem] leading-snug font-semibold text-[color:var(--text)]">
            {product.name}
          </h3>
          {unavailable && (
            <span className="verde-sold-out shrink-0 rounded-full px-2.5 py-1 text-[0.62rem]">
              ناموجود
            </span>
          )}
        </div>

        {product.latinName && (
          <Latin className="block truncate text-[0.64rem] tracking-[0.2em] text-[color:var(--text-mute)] uppercase">
            {product.latinName}
          </Latin>
        )}

        <p className="line-clamp-2 text-[0.8rem] leading-relaxed text-[color:var(--text-dim)]">
          {product.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <Price value={product.price} className="text-[color:var(--accent-deep)]" />
          {!unavailable && (
            <span className="verde-add grid size-9 shrink-0 place-items-center rounded-full" aria-hidden="true">
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
      className="group relative flex h-full w-full flex-col overflow-hidden bg-[color:var(--surface)] text-start press-[0.99]"
      style={{ boxShadow: 'var(--shadow-lift)', borderRadius: 'var(--radius-lg)' }}
    >
      <div
        className="aspect-[4/5] w-full shrink-0 overflow-hidden bg-[color:var(--surface-2)]"
        style={{ ['--breathe' as string]: '10s' }}
      >
        {broken ? (
          <span className="media-fallback h-full w-full font-display text-xl">
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
            className={`verde-photo h-full w-full object-cover ${loaded ? '' : 'scale-105 blur-sm'}`}
          />
        )}
        <div className="verde-scrim absolute inset-0" />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="verde-label inline-block rounded-full bg-[color:color-mix(in_oklab,var(--surface)_85%,transparent)] px-2.5 py-1 text-[0.6rem] text-[color:var(--accent-deep)]">
            {product.badge ?? 'امضای نواره'}
          </span>
          <h3 className="mt-3 line-clamp-2 text-[1.05rem] leading-tight font-bold text-[color:var(--text)]">
            {product.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-relaxed text-[color:var(--text-dim)]">
            {product.description}
          </p>
          <div className="mt-3">
            <Price value={product.price} className="text-[color:var(--accent-deep)]" />
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
      className="scroll-mt-24 px-5 py-10 sm:px-8 sm:py-14"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <h2
            id={`heading-${category.id}`}
            className="text-xl font-bold tracking-tight text-[color:var(--text)] sm:text-2xl"
          >
            {category.name}
          </h2>
          <Latin className="text-[0.64rem] tracking-[0.34em] text-[color:var(--accent)] uppercase">
            {category.latin}
          </Latin>
          <div className="mt-1 w-full max-w-[12rem]">
            <Stem />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((product, i) => (
            <div key={product.id} className="verde-unfurl" style={{ animationDelay: `${stagger(i, 60)}ms` }}>
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
        className="verde-fade absolute inset-0 bg-[color:color-mix(in_oklab,var(--text)_45%,transparent)] backdrop-blur-[3px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="verde-sheet verde-sheet-bg relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden"
        style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}
      >
        {/* z-10: the cover below pulls up over this row with -mt-10, so without an
            explicit stacking order the close button sits under the photograph
            and cannot be tapped on a phone. */}
        <div className="relative z-10 flex shrink-0 justify-end gap-2 px-4 pt-4">
          <button
            onClick={onClose}
            aria-label="بستن"
            className="noire-glass-1 grid size-10 place-items-center rounded-full text-[color:var(--text)] press-0.90"
          >
            {Icon.close}
          </button>
        </div>

        <div className="relative -mt-10 aspect-[16/10] w-full shrink-0 overflow-hidden sm:-mt-0 sm:rounded-t-[var(--radius-lg)]">
          {broken ? (
            <span className="media-fallback h-full w-full font-display text-2xl">
              {product.latinName ?? product.name}
            </span>
          ) : (
            <img
              src={imageSrc(product, 'lg')}
              alt={product.name}
              decoding="async"
              onError={() => setBroken(true)}
              className="verde-photo h-full w-full object-cover"
            />
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-4">
          {product.latinName && (
            <Latin className="block text-[0.64rem] tracking-[0.32em] text-[color:var(--accent)] uppercase">
              {product.latinName}
            </Latin>
          )}
          <h2 className="mt-2 text-2xl leading-tight font-bold tracking-tight text-[color:var(--text)]">
            {product.name}
          </h2>

          <div className="mt-4">
            <Stem withSprig={false} />
          </div>

          <p className="mt-4 text-[0.92rem] leading-relaxed text-[color:var(--text-dim)]">
            {product.description}
          </p>

          {unavailable && (
            <div className="verde-sold-out mt-5 rounded-2xl px-4 py-3 text-sm">
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
                choiceClassName="verde-choice"
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
              rowClassName="verde-glass"
              selectedRowClassName="verde-glass ring-1 ring-[color:var(--accent)]"
              addClassName="verde-cta"
            />
          )}

        </div>

        <div className="safe-b shrink-0 border-t border-[color:var(--line)] px-5 pt-4">
          {!unavailable && (
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-[color:var(--text-dim)]">تعداد</span>
              <div className="noire-glass-1 flex items-center gap-1 rounded-full p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="کاهش تعداد"
                  className="verde-step grid size-10 place-items-center rounded-full text-[color:var(--text)] disabled:opacity-30"
                >
                  {Icon.minus}
                </button>
                <span className="tnum w-8 text-center text-base font-semibold">
                  {quantity.toLocaleString('fa-IR', { useGrouping: false })}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  aria-label="افزایش تعداد"
                  className="verde-step grid size-10 place-items-center rounded-full text-[color:var(--text)]"
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
            className="verde-cta flex w-full items-center justify-center gap-3 px-6 py-4 text-base font-bold press-[0.985] disabled:opacity-50"
            style={{ borderRadius: 'var(--radius-pill)' }}
          >
            <span>{unavailable ? 'ناموجود' : 'افزودن به سفارش'}</span>
            {!unavailable && (
              <>
                <span className="h-4 w-px bg-[color:color-mix(in_oklab,var(--on-accent)_28%,transparent)]" aria-hidden="true" />
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
      className={`safe-b pointer-events-none fixed inset-x-0 top-0 z-40 flex h-[100dvh] items-end justify-center px-4 transition-opacity duration-400 ${
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
        className={`verde-glass pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-full py-2.5 pe-2 ps-2 press-[0.99] ${visible ? 'translate-y-0' : 'translate-y-6'}`}
        style={{ boxShadow: 'var(--shadow-lift)' }}
      >
        <span
          className="grid size-12 shrink-0 place-items-center rounded-full"
          style={{ background: 'var(--accent)' }}
        >
          <span key={cart.count} className="cart-count tnum text-lg font-bold text-[color:var(--on-accent)]">
            {cart.count.toLocaleString('fa-IR', { useGrouping: false })}
          </span>
        </span>

        <span className="flex-1 text-start text-sm text-[color:var(--text-dim)]">
          {cart.count.toLocaleString('fa-IR', { useGrouping: false })} آیتم در سفارش
        </span>

        <Price value={cart.total} className="text-[color:var(--accent-deep)]" />

        <span
          className="grid size-10 shrink-0 place-items-center rounded-full"
          style={{ background: 'color-mix(in oklab, var(--accent) 18%, transparent)' }}
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
        className="verde-fade absolute inset-0 bg-[color:color-mix(in_oklab,var(--text)_45%,transparent)] backdrop-blur-[3px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="سفارش شما"
        className="verde-sheet verde-sheet-bg relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden"
        style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 px-5 pt-5 pb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[color:var(--text)]">سفارش شما</h2>
            <p className="text-xs text-[color:var(--text-mute)]">میز شماره ۸ · پیش‌نمایش</p>
          </div>
          <button
            onClick={cart.close}
            aria-label="بستن"
            className="noire-glass-1 grid size-10 place-items-center rounded-full text-[color:var(--text)] press-0.90"
          >
            {Icon.close}
          </button>
        </div>

        <div className="px-5 pb-2">
          <Stem />
        </div>

        {cart.lines.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-semibold text-[color:var(--text)]">سبد شما خالی است</p>
            <p className="mt-2 text-sm text-[color:var(--text-mute)]">از منو یک آیتم انتخاب کنید.</p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2">
              {cart.lines.map((line) => (
                <div
                  key={line.key}
                  data-removing={cart.removingKey === line.key} className="flex items-center gap-3 border-b border-[color:var(--line)] py-3.5 last:border-0"
                >
                  <img
                    src={`/images/${line.image}-sm.webp`}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="verde-photo size-14 shrink-0 rounded-[1rem_1rem_1rem_0.35rem] object-cover"
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
                      className="mt-1 text-[color:var(--accent-deep)]"
                    />
                  </div>

                  <button
                    onClick={() => cart.remove(line.key)}
                    aria-label={`حذف ${line.name}`}
                    className="verde-remove grid size-9 shrink-0 place-items-center rounded-full"
                  >
                    {Icon.trash}
                  </button>

                  <div className="noire-glass-1 flex shrink-0 items-center gap-1 rounded-full p-1">
                    <button
                      onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                      aria-label="کاهش"
                      className="verde-step grid size-8 place-items-center rounded-full text-[color:var(--text-dim)]"
                    >
                      {Icon.minus}
                    </button>
                    <span className="tnum w-6 text-center text-sm font-semibold">
                      {line.quantity.toLocaleString('fa-IR', { useGrouping: false })}
                    </span>
                    <button
                      onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                      aria-label="افزایش"
                      className="verde-step grid size-8 place-items-center rounded-full text-[color:var(--text-dim)]"
                    >
                      {Icon.plus}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="safe-b shrink-0 px-5 pt-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-[color:var(--text-dim)]">جمع کل</span>
                <Price value={cart.total} size="xl" className="text-[color:var(--accent-deep)]" />
              </div>
              <button
                className="verde-cta flex w-full items-center justify-center px-6 py-4 text-base font-bold press-[0.985]"
                style={{ borderRadius: 'var(--radius-pill)' }}
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
    <footer className="px-5 pt-8 pb-32 text-center sm:px-8">
      <div className="mx-auto max-w-md">
        <div className="mx-auto w-full max-w-[10rem]">
          <Stem />
        </div>
        <h2 className="mt-5 text-lg font-bold tracking-tight text-[color:var(--text)]">{venue.name}</h2>
        <Latin className="mt-1.5 block text-[0.66rem] tracking-[0.34em] text-[color:var(--accent)] uppercase">
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

export const verdeTheme: Theme = {
  id: 'verde',
  name: 'سبزینه',
  latin: 'VERDE',
  descriptor: 'ارگانیک · طبیعی',
  pitch: 'زمین گرم کاغذی، سبز مریمی و خاک رسی، گوشه‌های نامتقارن و نشانه‌های گیاهی.',
  swatch: ['#f4f0e6', '#6b8f5e'],
  scope: 'verde',
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