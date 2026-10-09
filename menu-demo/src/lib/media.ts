/**
 * Presentation-only helpers shared by all themes.
 *
 * Business logic, cart maths, and money formatting stay out of here — themes
 * receive them already computed.
 */

import type { Product } from '../types/catalog'

/**
 * 404-tolerant image source.
 *
 * Docs/product/design-system.md §8.2 requires a missing image to fall back to
 * a typographic card rather than a broken icon. Every theme routes its <img>
 * through this so that rule is implemented once.
 */
export function imageSrc(product: Product, size: 'sm' | 'lg'): string {
  return `/images/${product.image}-${size}.webp`
}

export function imageSrcSet(product: Product): string {
  return `${imageSrc(product, 'sm')} 520w, ${imageSrc(product, 'lg')} 1000w`
}

/** True when the browser failed to load the photograph. */
export function imageFailed(target: EventTarget | null): boolean {
  return target instanceof HTMLImageElement && target.naturalWidth === 0
}

/** Deterministic per-product variation so stagger delays never need randomness. */
export function stagger(index: number, step = 55, cap = 6): number {
  return Math.min(index, cap) * step
}

/** A stable 0–1 value from a string, for picking decorative variants. */
export function hashUnit(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash) / 0x7fffffff
}