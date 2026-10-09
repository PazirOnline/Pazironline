/**
 * Shared domain types — the single source of truth every theme renders.
 *
 * These mirror Docs/technical/data-model.md. Nothing in this file may be
 * themed: themes receive this data and choose how to present it.
 */

export type Money = number // integer. Currency unit is an OPEN QUESTION (B-1) — demo assumes Toman.

export interface Choice {
  id: string
  label: string
  /** Price delta. 0 = no extra charge. */
  price: Money
}

export interface OptionGroup {
  id: string
  label: string
  required: boolean
  choices: Choice[]
}

/**
 * A purchasable variant of a product - a different size or form of the same
 * thing at its own price, e.g. espresso single vs double.
 *
 * Distinct from an OptionGroup: options *modify* one product (milk, sugar) and
 * carry a price delta, whereas a variant *is* the product at a different size
 * and carries its own absolute price. A product has either options, variants,
 * or both.
 */
export interface Variant {
  id: string
  label: string
  /** Absolute price for this variant, same unit as Product.price. */
  price: Money
  /** Defaults to the product's own availability. */
  available?: boolean
}

export interface Product {
  id: string
  categoryId: string
  name: string
  /** Optional Latin name rendered as a small companion line. */
  latinName?: string
  description: string
  price: Money
  /** Base filename in /public/images (without -sm / -lg). */
  image: string
  /** MVP availability - ‎���� unavailable items stay visible but are not orderable (C8). */
  available: boolean
  badge?: string
  options?: OptionGroup[]
  /**
   * Present only on products sold in more than one size/form. Themes render
   * these as a priced list; products without them must show no variant UI at
   * all rather than an empty container.
   */
  variants?: Variant[]
}

export interface Category {
  id: string
  name: string
  latin: string
}

/** Restaurant identity. One per venue; every venue shares the same catalog. */
export interface Venue {
  id: string
  name: string
  latin: string
  monogram: string
  descriptor: string
  tagline: string
  status: string
  location: string
  /** Cover photograph used as the hero backdrop. */
  cover: string
}

export interface CartLine {
  /** Stable key: productId + sorted selected choice ids. */
  key: string
  productId: string
  name: string
  image: string
  quantity: number
  unitPrice: Money
  selected: Choice[]
}

export interface Section {
  category: Category
  items: Product[]
}