/**
 * Theme contract.
 *
 * A theme is a complete visual identity: layout, typography, colour, motion,
 * image treatment, and every customer-facing surface. It is a *presentation*
 * layer only — it receives shared view state and returns JSX. It must never
 * fetch data, own business logic, or duplicate the cart.
 *
 * Contract rules (Docs/theme-system.md):
 *  1. Every slot must be implemented. No default fallback slot exists, because a
 *     fallback is how five themes quietly become one theme.
 *  2. `id` is a string, not a union of five literals. Theme 6 must not require
 *     an edit to this file.
 *  3. Only presentation varies. All five themes render the same catalog, the
 *     same cart, the same session state.
 */

import type { ReactNode } from 'react'
import type { CartLine, Category, Choice, Money, Product, Section, Venue } from './catalog'

/** Everything a theme needs to render. Read-only. */
export interface MenuView {
  venue: Venue
  sections: Section[]
  categories: Category[]
  /** Products promoted by the venue, in display order. */
  signature: Product[]
  /** Table number as a Persian string, or null when there is no table context. */
  table: string | null
}

export interface CartView {
  lines: CartLine[]
  count: number
  total: Money
  isOpen: boolean
  /** Key of the line currently animating out, or null (motion.md §8). */
  removingKey: string | null
  open: () => void
  close: () => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
}

export interface ProductSheetView {
  product: Product
  onClose: () => void
  onAdd: (product: Product, quantity: number, selected: Choice[]) => void
  /**
   * 'open' while presented, 'closing' for the length of the exit so the theme
   * can play a leave animation before the node is dropped. See usePresence.
   */
  state: 'open' | 'closing'
}

/** The nine slots a theme must fill. */
export interface ThemeSlots {
  /** Full-screen backdrop layers: gradients, grain, textures. Behind everything. */
  Backdrop: () => ReactNode
  /** Restaurant identity. */
  Hero: (props: { venue: Venue }) => ReactNode
  /** Sticky category navigation. */
  CategoryNav: (props: { categories: Category[]; activeId: string; onSelect: (id: string) => void }) => ReactNode
  /** One category: heading + the product grid/list. */
  CategorySection: (props: { section: Section; onOpen: (product: Product) => void }) => ReactNode
  /** A product tile/row inside a category. */
  ProductCard: (props: { product: Product; onOpen: (product: Product) => void }) => ReactNode
  /** Promoted product, used by the venue's signature strip. */
  SignatureCard: (props: { product: Product; onOpen: (product: Product) => void }) => ReactNode
  /** Product detail overlay. */
  ProductSheet: (props: ProductSheetView) => ReactNode
  /** Floating cart affordance. */
  CartBar: (props: { cart: CartView }) => ReactNode
  /** Cart review overlay. */
  CartSheet: (props: { cart: CartView }) => ReactNode
  /** Closing footer, above the safe area. */
  Footer: (props: { venue: Venue }) => ReactNode
}

export interface ThemeMeta {
  id: string
  name: string
  latin: string
  /** Short positioning line, e.g. «لوکس · تحریری». */
  descriptor: string
  /** Longer sentence used in the theme gallery. */
  pitch: string
  /** Two swatches driving the gallery preview card. */
  swatch: [string, string]
  /** Marks the theme the product ships as default. */
  flagship?: boolean
}

export interface Theme extends ThemeMeta {
  /** Scopes every CSS custom property this theme defines. */
  scope: string
  /** Injected once at boot so the shell can paint the correct background early. */
  css: string
  slots: ThemeSlots
}