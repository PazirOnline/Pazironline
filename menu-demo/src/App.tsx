import { useCallback, useMemo, useState } from 'react'
import type { Product, Section } from './types/catalog'
import type { CartView, ProductSheetView } from './types/theme'
import { ThemeGallery, ThemeTrigger } from './components/ThemeGallery'
import { useCart } from './hooks/useCart'
import { useTheme } from './hooks/useTheme'
import { usePresence, useScrollSpy } from './lib/ui'
import { defaultThemeId, getTheme, themes } from './themes/registry'
import { getVenue } from './data/venues'
import {
  categories,
  products,
  productsByCategory,
  signatureIds,
} from './data/catalog'

/**
 * Application shell.
 *
 * Owns exactly four things: which theme is active, which product is open, the
 * cart, and the scrolled category. Everything visual is delegated to the active
 * theme's slots. Adding a theme requires no change to this file.
 */

export default function App() {
  const { themeId, select } = useTheme(defaultThemeId)
  const theme = getTheme(themeId)
  const venue = getVenue(themeId)

  const cart = useCart()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  // Scroll-spy over theme-rendered sections. The themes own the layout, so this
  // measures the DOM instead of assuming a structure. The setter is exposed so a
  // nav tap can update immediately rather than waiting for the scroll event.
  const [activeCategory, setActiveCategory] = useScrollSpy(categories.map((c) => c.id))

  // Holds the sheet mounted through its exit so it can animate out instead of
  // vanishing on the same frame it is dismissed (motion.md §7).
  const sheetPresence = usePresence(sheetOpen)

  /** Open a product, replacing whatever was on screen. */
  const openProduct = useCallback((product: Product) => {
    setSelectedProduct(product)
    setSheetOpen(true)
  }, [])

  const closeProduct = useCallback(() => setSheetOpen(false), [])

  // Switching themes unmounts the previous theme's overlays, but the product
  // selection is shared state — closing it avoids a detail sheet rendered by one
  // theme surviving over the next. Dropped without a transition: the outgoing
  // theme's nodes are about to be replaced wholesale anyway.
  const selectTheme = useCallback(
    (id: string) => {
      cart.closeCart()
      setSheetOpen(false)
      setSelectedProduct(null)
      select(id)
    },
    [cart, select],
  )

  const signature = useMemo(
    () =>
      signatureIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [],
  )

  const cartView: CartView = {
    lines: cart.lines,
    count: cart.count,
    total: cart.total,
    isOpen: cart.isOpen,
    removingKey: cart.removingKey,
    open: cart.openCart,
    close: cart.closeCart,
    setQuantity: cart.setQuantity,
    remove: cart.remove,
  }

  const sheetView = (product: Product): ProductSheetView => ({
    product,
    onClose: closeProduct,
    onAdd: (p, quantity, selected) => {
      cart.add({ product: p, quantity, selected })
      closeProduct()
    },
    state: sheetPresence.state,
  })

  const { Backdrop, Hero, CategoryNav, CategorySection, SignatureCard, ProductSheet, CartBar, CartSheet, Footer } =
    theme.slots

  return (
    <>
      <Backdrop />

      <a
        href="#section-hot"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[70] focus:rounded-full focus:bg-cream-50 focus:px-4 focus:py-2 focus:text-ink-950"
      >
        رفتن به منو
      </a>

      <Hero venue={venue} />
      <CategoryNav
        categories={categories}
        activeId={activeCategory}
        onSelect={setActiveCategory}
      />

      <main>
        {/* Signature strip: each theme decides whether this is a photo row, a
            typographic banner, or something else entirely. */}
        <section aria-labelledby="heading-signature" className="px-5 pt-10 pb-4 sm:px-8 sm:pt-14">
          <div className="mx-auto max-w-4xl">
            <div className="mb-5 flex flex-col items-center gap-1.5 text-center">
              <h2 id="heading-signature" className="text-xl font-bold text-cream-50 sm:text-2xl">
                پیشنهاد سرویس
              </h2>
              <p className="text-sm text-cream-400">
                {venue.latin} · Signature Selection
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3.5 sm:gap-5">
              {signature.map((product, i) => (
                <div
                  key={product.id}
                  className="theme-stagger"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <SignatureCard product={product} onOpen={openProduct} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {(productsByCategory as Section[]).map((section) => (
          <CategorySection
            key={section.category.id}
            section={section}
            onOpen={openProduct}
          />
        ))}

        <Footer venue={venue} />
      </main>

      <CartBar cart={cartView} />

      {selectedProduct && sheetPresence.mounted && (
        <ProductSheet {...sheetView(selectedProduct)} />
      )}
      <CartSheet cart={cartView} />

      {/* The trigger stands down whenever an overlay owns the screen, so it
          never sits on top of a sheet's total or its primary action. */}
      <ThemeTrigger
        onOpen={() => setGalleryOpen(true)}
        raised={cart.count > 0}
        hidden={galleryOpen || cart.isOpen || sheetOpen}
      />
      <ThemeGallery
        themes={themes}
        activeId={themeId}
        onSelect={selectTheme}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </>
  )
}