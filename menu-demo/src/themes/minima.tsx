import { useEffect, useMemo, useState } from 'react'
import type { Category, Product, Section } from '../types/catalog'
import type { CartView, ProductSheetView, Theme } from '../types/theme'
import { Icon, Latin, OptionChoices, Price, VariantRows, useOverlay, usePresence, useVariantSelection, variantChoice } from '../lib/ui'
import { imageSrc, imageSrcSet, stagger } from '../lib/media'
import './minima.css'

type VenueProps = { venue: import('../types/catalog').Venue }


/**
 * MINIMA — Theme 03. Architectural minimalism.
 *
 * The structural bet: a *list*, not a grid. A premium café's most confident
 * digital menu is a precise typographic index where price and name sit on a
 * baseline with a leader between them, and the photograph is a supporting
 * element rather than the page. That inverts every other theme's hierarchy:
 *  - Products are full-width rows on mobile, an asymmetric 2-up on desktop
 *  - Photography is small and consistently cropped to a letterbox band
 *  - Section headings are numbered and set in tight caps
 *  - Corners are square; separation uses hairlines, not shadows
 *  - Motion is opacity plus a few pixels of translation, 200ms, no bounce
 */

/* ── Backdrop ─────────────────────────────────────────────────────────── */

function Backdrop() {
  return null
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

function Hero({ venue }: VenueProps) {
  return (
    <header className="minima-enter border-b border-[color:var(--line)] px-5 pt-12 pb-9 sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <span className="minima-label block text-[color:var(--text-mute)]">
              {venue.status} · {venue.location}
            </span>

            <h1 className="mt-5 flex flex-col gap-1">
              <span className="text-4xl leading-[1.05] font-bold tracking-tight text-[color:var(--text)] sm:text-6xl">
                {venue.name}
              </span>
              <Latin className="mt-1 text-sm tracking-[0.3em] text-[color:var(--text-dim)] uppercase">
                {venue.latin}
              </Latin>
            </h1>

            <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-[color:var(--text-dim)]">
              {venue.descriptor} — {venue.tagline}
            </p>
          </div>

          {/* A single narrow cover band. Deliberately not a hero image: the
              name is the hero. */}
          <div className="hidden aspect-[3/4] w-32 shrink-0 overflow-hidden bg-[color:var(--surface-2)] sm:block lg:w-40">
            <img
              src={`/images/${venue.cover}-lg.webp`}
              alt=""
              aria-hidden="true"
              className="minima-zoom h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        <div className="mt-9 flex items-baseline justify-between gap-4">
          <span className="minima-label text-[color:var(--text-mute)]">منو · Menu</span>
          <div className="h-px flex-1 bg-[color:var(--line)]" aria-hidden="true" />
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
  return (
    <div className="sticky top-0 z-40">
      <div className="minima-bar">
        {/* Mirrors the section wrapper: full-bleed padding on the outside, the
            rail centred to the same column width as the menu below it. */}
        <div className="px-5 sm:px-8">
        <div
          className="no-scrollbar rail mx-auto w-full max-w-4xl items-stretch gap-0"
          role="tablist"
          aria-label="دسته‌بندی منو"
        >
          {categories.map((category, index) => {
            const isActive = category.id === activeId
            return (
              <button
                key={category.id}
                role="tab"
                aria-selected={isActive}
                data-selected={isActive}
                onClick={() => {
                  document
                    .getElementById(`section-${category.id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  onSelect(category.id)
                }}
                className={`minima-chip relative shrink-0 snap-start px-4 py-3.5 text-sm whitespace-nowrap ${
                  index > 0 ? 'border-s border-[color:var(--line)]' : ''
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

/* ── Product row ──────────────────────────────────────────────────────── */

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
      className="minima-card group flex w-full items-start gap-4 border-b border-[color:var(--line)] py-5 text-start press-[0.995] transition-colors duration-150 hover:bg-[color:color-mix(in_oklab,var(--text)_2.5%,transparent)]"
    >
      {/* Letterbox band: consistent, quiet, and never the loudest thing here. */}
      <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden bg-[color:var(--surface-2)] sm:w-28">
        {broken ? (
          <span className="media-fallback h-full w-full text-[0.7rem]">
            {product.latinName ?? product.name}
          </span>
        ) : (
          <img
            src={imageSrc(product, 'sm')}
            srcSet={imageSrcSet(product)}
            sizes="112px"
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setBroken(true)}
            className={`minima-photo h-full w-full object-cover ${loaded ? '' : 'blur-sm'}`}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <h3 className="min-w-0 flex-1 text-[1rem] leading-snug font-semibold text-[color:var(--text)]">
            {product.name}
          </h3>
          {unavailable ? (
            <span className="minima-sold-out shrink-0 px-2 py-0.5 text-[0.62rem]">ناموجود</span>
          ) : (
            <Price
              value={product.price}
              size="sm"
              className="shrink-0 text-[color:var(--text)]"
            />
          )}
        </div>

        {product.latinName && (
          <Latin className="mt-1 block truncate text-[0.62rem] tracking-[0.22em] text-[color:var(--text-mute)] uppercase">
            {product.latinName}
          </Latin>
        )}

        <p className="mt-2 line-clamp-2 text-[0.8rem] leading-relaxed text-[color:var(--text-dim)]">
          {product.description}
        </p>

        <div className="mt-2 flex items-center gap-2">
          {product.badge && (
            <span className="minima-label border border-[color:var(--line-strong)] px-2 py-0.5 text-[0.55rem] text-[color:var(--text-dim)]">
              {product.badge}
            </span>
          )}
          {!unavailable && (
            <span className="minima-add grid size-6 place-items-center" aria-hidden="true">
              {Icon.plus}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ── Signature card ───────────────────────────────────────────────────── */

/** On MINIMA the signature strip is a typographic banner, not a photo card. */
function SignatureCard({
  product,
  onOpen,
}: {
  product: Product
  onOpen: (product: Product) => void
}) {
  const [broken, setBroken] = useState(false)

  return (
    <button
      onClick={() => onOpen(product)}
      className="group flex w-full items-stretch gap-3 bg-[color:var(--surface)] p-4 text-start transition-colors duration-150 hover:bg-[color:var(--surface-2)] sm:gap-5 sm:p-5"
    >
      <div className="order-2 flex min-w-0 flex-1 flex-col justify-center">
        <span className="minima-label text-[color:var(--text-mute)]">پیشنهاد · Signature</span>
        <h3 className="mt-3 text-lg leading-tight font-bold text-[color:var(--text)] sm:text-2xl">
          {product.name}
        </h3>
        {product.latinName && (
          <Latin className="mt-1.5 block truncate text-[0.62rem] tracking-[0.28em] text-[color:var(--text-dim)] uppercase">
            {product.latinName}
          </Latin>
        )}
        <p className="mt-3 line-clamp-2 text-[0.82rem] leading-relaxed text-[color:var(--text-dim)]">
          {product.description}
        </p>
        {/* Wraps: at two-up on a phone the text column is barely 110px wide, and a
            single fixed row of price + rule + label would overflow the card. */}
        <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Price value={product.price} className="text-[color:var(--text)]" />
          <span className="h-px w-8 shrink-0 bg-[color:var(--line-strong)]" aria-hidden="true" />
          <span className="minima-label text-[color:var(--text-mute)]">مشاهده</span>
        </div>
      </div>

      <div className="order-1 aspect-[3/4] w-[34%] shrink-0 overflow-hidden bg-[color:var(--surface-2)] sm:w-32 lg:w-36">
        {broken ? (
          <span className="media-fallback h-full w-full text-[0.7rem]">
            {product.latinName ?? product.name}
          </span>
        ) : (
          <img
            src={imageSrc(product, 'sm')}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            className="minima-photo h-full w-full object-cover"
          />
        )}
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
  const index = Number.parseInt(category.id.replace(/\D/g, ''), 10) || 0

  return (
    <section
      id={`section-${category.id}`}
      aria-labelledby={`heading-${category.id}`}
      className="scroll-mt-16 px-5 py-10 sm:px-8 sm:py-14"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-baseline gap-4">
          <span className="tnum text-[0.7rem] font-semibold text-[color:var(--text-mute)]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2
            id={`heading-${category.id}`}
            className="flex flex-col gap-1.5 text-2xl leading-none font-bold tracking-tight text-[color:var(--text)] sm:text-3xl"
          >
            <span>{category.name}</span>
            <Latin className="text-[0.6rem] font-medium tracking-[0.34em] text-[color:var(--text-mute)] uppercase">
              {category.latin}
            </Latin>
          </h2>
        </div>
        <div className="minima-rule mb-4" style={{ animationDelay: '60ms' }} />

        {/* A single column of rows: on desktop the two halves are offset so the
            list stays readable instead of becoming a two-column wall. */}
        <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
          {items.map((product, i) => (
            <div key={product.id} className="minima-enter" style={{ animationDelay: `${stagger(i, 40)}ms` }}>
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
        className="minima-fade absolute inset-0 bg-[color:color-mix(in_oklab,var(--text)_40%,transparent)]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="minima-sheet minima-glass relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--line)] px-5 py-4">
          <span className="minima-label text-[color:var(--text-mute)]">جزئیات · Detail</span>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="grid size-9 place-items-center border border-[color:var(--line)] transition-colors hover:bg-[color:color-mix(in_oklab,var(--text)_6%,transparent)]"
          >
            {Icon.close}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[color:var(--surface-2)]">
            {broken ? (
              <span className="media-fallback h-full w-full">{product.latinName ?? product.name}</span>
            ) : (
              <img
                src={imageSrc(product, 'lg')}
                alt={product.name}
                decoding="async"
                onError={() => setBroken(true)}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="px-5 py-6">
            {product.latinName && (
              <Latin className="minima-label block text-[color:var(--text-mute)]">
                {product.latinName}
              </Latin>
            )}
            <h2 className="mt-3 text-3xl leading-tight font-bold tracking-tight text-[color:var(--text)]">
              {product.name}
            </h2>

            <div className="mt-4 flex items-baseline justify-between gap-4 border-y border-[color:var(--line)] py-3">
              <span className="text-sm text-[color:var(--text-dim)]">قیمت</span>
              <Price value={product.price} size="lg" className="text-[color:var(--text)]" />
            </div>

            <p className="mt-4 text-[0.92rem] leading-relaxed text-[color:var(--text-dim)]">
              {product.description}
            </p>

            {unavailable && (
              <div className="minima-sold-out mt-5 border px-4 py-3 text-sm">
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
                  choiceClassName="minima-choice rounded-none"
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
              rowClassName="border border-[color:var(--line)]"
              selectedRowClassName="border-[color:var(--ink)] bg-[color:var(--surface)]"
              addClassName="minima-cta"
            />
          )}

          </div>
        </div>

        <div className="safe-b shrink-0 border-t border-[color:var(--line)] px-5 py-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-[color:var(--text-dim)]">تعداد</span>
            <div className="flex items-center gap-1 border border-[color:var(--line)]">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="کاهش تعداد"
                className="minima-step grid size-10 place-items-center disabled:opacity-30"
              >
                {Icon.minus}
              </button>
              <span className="tnum w-9 border-x border-[color:var(--line)] text-center text-sm font-semibold">
                {quantity.toLocaleString('fa-IR', { useGrouping: false })}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="افزایش تعداد"
                className="minima-step grid size-10 place-items-center"
              >
                {Icon.plus}
              </button>
            </div>
          </div>

          <button
            data-cta="add-to-cart"
            disabled={unavailable}
            onClick={() => {
              onAdd(product, quantity, priced)
              onClose()
            }}
            className="minima-cta press-[0.99] flex w-full items-center justify-center gap-3 px-6 py-4 text-sm font-semibold tracking-wide transition-opacity duration-150 disabled:opacity-40"
          >
            <span>{unavailable ? 'ناموجود' : 'افزودن به سفارش'}</span>
            {!unavailable && <span className="h-3 w-px bg-[color:color-mix(in_oklab,var(--on-accent)_35%,transparent)]" aria-hidden="true" />}
            {!unavailable && <Price value={unitPrice * quantity} size="cta" />}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Cart bar ─────────────────────────────────────────────────────────── */

/** A flat bar pinned to the bottom edge — a running total, not a floating pill. */
function CartBar({ cart }: { cart: CartView }) {
  const visible = cart.count > 0

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-40 flex h-[100dvh] flex-col justify-end transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-live="polite"
    >
      <div
        className={`border-t border-[color:var(--line-strong)] bg-[color:color-mix(in_oklab,var(--bg)_94%,transparent)] backdrop-blur-md transition-transform duration-200 ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <button
          data-cta="open-cart"
          onClick={cart.open}
          disabled={!visible}
          tabIndex={visible ? 0 : -1}
          aria-hidden={!visible}
          className="safe-b pointer-events-auto mx-auto flex w-full max-w-4xl items-center gap-4 px-5 py-3 text-start transition-colors duration-150 hover:bg-[color:color-mix(in_oklab,var(--text)_3%,transparent)]"
        >
          <span className="tnum min-w-6 text-xs font-semibold text-[color:var(--text-mute)]">
            {String(cart.count).padStart(2, '0')}
          </span>
          <span key={cart.count} className="cart-count min-w-0 flex-1 text-sm text-[color:var(--text)]">
            {cart.count.toLocaleString('fa-IR', { useGrouping: false })} آیتم · مشاهده سفارش
          </span>
          <Price value={cart.total} className="text-[color:var(--text)]" />
        </button>
      </div>
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
        className="minima-fade absolute inset-0 bg-[color:color-mix(in_oklab,var(--text)_40%,transparent)]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="سفارش شما"
        className="minima-sheet minima-glass relative flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--line)] px-5 py-4">
          <h2 className="text-sm font-bold tracking-wide text-[color:var(--text)]">سفارش شما</h2>
          <span className="minima-label text-[color:var(--text-mute)]">میز ۸ · پیش‌نمایش</span>
          <button
            onClick={cart.close}
            aria-label="بستن"
            className="grid size-9 place-items-center border border-[color:var(--line)] transition-colors hover:bg-[color:color-mix(in_oklab,var(--text)_6%,transparent)]"
          >
            {Icon.close}
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-sm font-semibold text-[color:var(--text)]">سبد شما خالی است</p>
            <p className="mt-2 text-[0.8rem] text-[color:var(--text-mute)]">از منو یک آیتم انتخاب کنید.</p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <table className="w-full border-collapse">
                <caption className="sr-only">اقلام سفارش</caption>
                <thead>
                  <tr className="border-b border-[color:var(--line)]">
                    <th scope="col" className="minima-label px-5 py-2.5 text-start text-[color:var(--text-mute)]">آیتم</th>
                    <th scope="col" className="minima-label w-16 px-2 py-2.5 text-center text-[color:var(--text-mute)]">تعداد</th>
                    <th scope="col" className="minima-label w-28 px-5 py-2.5 text-end text-[color:var(--text-mute)]">مبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.lines.map((line) => (
                    <tr key={line.key} data-removing={cart.removingKey === line.key} className="border-b border-[color:var(--line)] last:border-0">
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-medium text-[color:var(--text)]">{line.name}</p>
                        {line.selected.length > 0 && (
                          <p className="mt-1 text-[0.72rem] text-[color:var(--text-mute)]">
                            {line.selected.map((c) => c.label).join(' · ')}
                          </p>
                        )}
                        <button
                          onClick={() => cart.remove(line.key)}
                          aria-label={`حذف ${line.name}`}
                          className="minima-remove mt-2 inline-flex items-center gap-1 text-[0.68rem] transition-colors"
                        >
                          {Icon.trash}
                          حذف
                        </button>
                      </td>
                      <td className="px-2 py-4 align-top">
                        <div className="mx-auto flex items-center border border-[color:var(--line)]">
                          <button
                            onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                            aria-label="کاهش"
                            className="minima-step grid size-8 place-items-center"
                          >
                            {Icon.minus}
                          </button>
                          <span className="tnum w-7 text-center text-xs font-semibold">
                            {line.quantity.toLocaleString('fa-IR', { useGrouping: false })}
                          </span>
                          <button
                            onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                            aria-label="افزایش"
                            className="minima-step grid size-8 place-items-center"
                          >
                            {Icon.plus}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-end align-top">
                        <Price
                          value={line.unitPrice * line.quantity}
                          size="sm"
                          className="text-[color:var(--text)]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="safe-b shrink-0 border-t border-[color:var(--line-strong)] px-5 py-4">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-sm text-[color:var(--text-dim)]">جمع کل</span>
                <Price value={cart.total} size="lg" className="text-[color:var(--text)]" />
              </div>
              <button
                className="minima-cta w-full px-6 py-4 text-sm font-semibold tracking-wide transition-opacity duration-150"
                onClick={cart.close}
              >
                ادامه‌ی منو
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
        <div className="h-px w-full bg-[color:var(--line)]" aria-hidden="true" />
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
          <Latin className="text-[0.7rem] tracking-[0.34em] text-[color:var(--text-mute)] uppercase">
            {venue.latin}
          </Latin>
          <p className="text-[0.72rem] text-[color:var(--text-mute)]">
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

export const minimaTheme: Theme = {
  id: 'minima',
  name: 'مینیما',
  latin: 'MINIMA',
  descriptor: 'مدرن · مینیمال',
  pitch: 'فهرست تایپوگرافیک دقیق با گوشه‌های تیز، خطوط مویی، و حرکت اندازه‌گیری‌شده.',
  swatch: ['#f6f5f2', '#1a1813'],
  scope: 'minima',
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