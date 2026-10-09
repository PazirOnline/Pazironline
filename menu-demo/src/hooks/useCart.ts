import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CartLine, Choice, Money, Product } from '../types/catalog'

export interface AddPayload {
  product: Product
  quantity: number
  selected: Choice[]
}

export interface CartApi {
  lines: CartLine[]
  count: number
  total: Money
  isOpen: boolean
  /**
   * Key of the line currently animating out, or null.
   *
   * The line stays in `lines` for the length of its exit so the theme can play
   * a departure before the row is dropped (motion.md §8). Themes read this and
   * mark the row `data-removing`.
   */
  removingKey: string | null
  add: (payload: AddPayload) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  openCart: () => void
  closeCart: () => void
  clear: () => void
}

/**
 * Cart persistence.
 *
 * OF11 / C12: the draft must survive refresh. This is a *client* concern and
 * must never be confused with the server-side customer session
 * (Docs/flows/ordering-flow.md §3.3).
 */
const STORAGE_KEY = 'menudigitaly.cart.v1'

function readStored(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Shape check: one bad entry must not poison the whole cart.
    return parsed.filter(
      (line): line is CartLine =>
        typeof line === 'object' &&
        line !== null &&
        typeof (line as CartLine).key === 'string' &&
        typeof (line as CartLine).quantity === 'number' &&
        (line as CartLine).quantity > 0,
    )
  } catch {
    return []
  }
}

/** How long a removed line stays mounted so its exit can play. */
const REMOVE_MS = 240

const lineKey = (productId: string, selected: Choice[]) =>
  `${productId}::${selected
    .map((c) => c.id)
    .sort()
    .join('|')}`

export function useCart(): CartApi {
  const [lines, setLines] = useState<CartLine[]>(readStored)
  const [isOpen, setIsOpen] = useState(false)
  const [removingKey, setRemovingKey] = useState<string | null>(null)
  const removeTimer = useRef<number | null>(null)

  // Never leave a pending removal to fire into an unmounted cart.
  useEffect(
    () => () => {
      if (removeTimer.current !== null) window.clearTimeout(removeTimer.current)
    },
    [],
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // Private browsing or a full quota: the cart still works in memory.
    }
  }, [lines])

  const add = useCallback(({ product, quantity, selected }: AddPayload) => {
    const unitPrice = product.price + selected.reduce((sum, c) => sum + c.price, 0)
    const key = lineKey(product.id, selected)

    setLines((prev) => {
      const existing = prev.find((line) => line.key === key)
      if (existing) {
        return prev.map((line) =>
          line.key === key ? { ...line, quantity: line.quantity + quantity } : line,
        )
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          image: product.image,
          quantity,
          unitPrice,
          selected,
        },
      ]
    })
  }, [])

  const remove = useCallback((key: string) => {
    // Mark first, drop after the exit has played. Removing on the same frame
    // would make the row disappear before its animation could start.
    setRemovingKey(key)
    removeTimer.current = window.setTimeout(() => {
      setLines((prev) => prev.filter((line) => line.key !== key))
      setRemovingKey(null)
    }, REMOVE_MS)
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    // Stepping down to zero is also a removal; give it the same exit rather
    // than letting the row blink out.
    if (quantity <= 0) {
      remove(key)
      return
    }
    setRemovingKey((pending) => (pending === key ? null : pending))
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, quantity } : line)))
  }, [remove])

  const count = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  )

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [lines],
  )

  return {
    lines,
    count,
    total,
    isOpen,
    removingKey,
    add,
    setQuantity,
    remove,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    clear: () => setLines([]),
  }
}