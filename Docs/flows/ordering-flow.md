# Ordering Flow

From cart to bill. The mechanical detail of how a customer places an order and follows it.

Related: [`customer-flow.md`](customer-flow.md) ·
[`../domain/order-system.md`](../domain/order-system.md) ·
[`../domain/order-state-machine.md`](../domain/order-state-machine.md) ·
[`../technical/idempotency.md`](../technical/idempotency.md)

---

## 1. What it is

The customer-side mechanics of constructing a draft cart, submitting it as an order, watching its
progress, and reviewing the resulting bill.

**Who uses it:** the customer (draft, submit, track) and staff (accept, prepare, deliver).

---

## 2. Why it exists

- Voice ordering loses orders, mis-records modifiers, and delays the kitchen.
- A structured order carries table, items, quantities, options, prices, and time — all of which are
  prerequisites for accurate billing, station routing, and reporting.

---

## 3. The cart

### 3.1 Definition

`DECIDED`

A **cart** is a client-side draft. It is not an order. It has no status, is not visible to staff, does
not enter the kitchen, and does not affect availability.

Converting a cart into an order is an explicit submit.

| Term | Meaning |
|---|---|
| **Cart** | Pre-submission draft (customer) |
| **Order** | Submitted, visible to staff, immutable in its snapshots |

See [`../product/terminology.md`](../product/terminology.md) §Documented anti-terms.

### 3.2 Cart contents

`DECIDED` (MVP)

| Field | Notes |
|---|---|
| Product reference | Live reference to a product |
| Quantity | Positive integer; large touch targets |
| Options / modifiers | Structure reserved (P8); full engine `FUTURE` |
| Snapshot of display price | For preview consistency only — **not** the order snapshot |

### 3.3 Cart persistence

`PROPOSED`

The cart should survive refresh and device reopen during the visit, like the session (C12).

**Implementation note:** cart persistence is a client concern (local storage keyed by table/session).
It must never be confused with the server-side session.

---

## 4. Order preview and submission

`DECIDED` (P5, C4, P18)

### 4.1 Optional customer details

At submission the customer **may** provide:

- First/last name — **optional**
- Phone number — **optional**

Neither is required. No other field is collected. There is no registration step.

**Why:** it helps staff identify the order ("the Cappuccino for Table 8") without forcing an account.

### 4.2 Submitting

```
[Submit order]
     ↓
Client generates an idempotency key (unique per submit attempt)
     ↓
POST order  { sessionId, items[], idempotencyKey }
     ↓
Server:
  • verifies the table session is APPROVED
  • verifies each item is still available
  • resolves current prices
  • writes the order + SNAPSHOT line items   (atomic)
  • records audit event
     ↓
201 Created { orderId, orderNumber, status }
```

Idempotent: a replay with the same key returns the same order. See
[`../technical/idempotency.md`](../technical/idempotency.md).

### 4.3 Guards before accepting an order

`PROPOSED` (each is a rule, not a UI feature)

| Guard | Reason |
|---|---|
| Table session exists and is `APPROVED` | P3 |
| Table session not closed | Can't order into a closed session |
| Every product exists and is not archived | P7 |
| Every product is currently available | «نامواست» |
| Quantities are valid positive integers | Data integrity |
| At least one line item | Empty order is meaningless |
| Idempotency key not already used | P10 |

A failure must produce a clear Persian message identifying the problem item, not a generic error.

---

## 5. Multiple orders in one session

`DECIDED`

A customer may submit any number of orders during one approved session, with no further approval.

```
14:20  access approved
14:22  order #1021   2× Cappuccino, 1× Cheesecake
14:40  order #1022   1× Burger
14:55  order #1023   1× Pizza, 1× Cake
```

### 5.1 Consequence for the customer view

`PROPOSED`

The customer's order area shows **all** orders in the session, each with its own status, plus a
session-level summary (total items, total spend).

Showing only the latest order would hide earlier items from the customer who placed them — bad for
trust and bad for the bill conversation.

### 5.2 Consequence for the bill

`DECIDED`

The bill is computed from **all** orders in the table session, not the latest one. See
[`../domain/billing.md`](../domain/billing.md).

---

## 6. Order status tracking

`DECIDED` capability · `OPEN QUESTION` transport

### 6.1 What the customer sees

Friendly Persian wording, never internal status names (P10).

| Internal | Customer-facing (proposed) | Customer sees an update when |
|---|---|---|
| `PENDING` | سفارش ثبت شد | Immediately on submit |
| `CONFIRMED` | سفارش تأیید شد | Staff accepts |
| `PREPARING` | در حال آماده‌سازی | Kitchen/bar starts |
| `READY` | تقریباً آماده است → آماده تحویل | Item(s) ready |
| `DELIVERED` | تحویل شد | Waiter delivers |
| `PAID` | پرداخت شد | Settlement recorded |
| `CLOSED` | — (terminal, hidden) | — |
| `CANCELLED` | لغو شد | `OPEN QUESTION` — see state machine |
| `REJECTED` | سفارش رد شد | `OPEN QUESTION` — not in the given lifecycle |

### 6.2 Requirements

| Requirement | Rationale |
|---|---|
| No manual refresh | C10 |
| Update arrives within seconds | Customer is waiting |
| All session orders tracked | §5 |
| Reconnection shows current truth, not a stale cache | P9 spirit |
| Never show a status the customer can't act on | C9 |

---

## 7. Bill review

`DECIDED`

The customer may view the bill: items, quantities, item prices, discounts if applicable, total. Payment
is made physically at the cashier. See [`../domain/billing.md`](../domain/billing.md).

**The customer cannot:** apply a discount, edit a line, or mark it paid (C14).

---

## 8. Business rules

| # | Rule | Status |
|---|---|---|
| OF1 | A cart is not an order | `DECIDED` |
| OF2 | Submission requires an approved, open table session | `DECIDED` |
| OF3 | Name and phone are optional | `DECIDED` |
| OF4 | Submission is idempotent | `DECIDED` |
| OF5 | Line items store snapshots; later menu edits never alter them | `DECIDED` |
| OF6 | Unavailable products cannot be submitted | `DECIDED` |
| OF7 | Multiple orders per session need no re-approval | `DECIDED` |
| OF8 | The bill aggregates all session orders | `DECIDED` |
| OF9 | Order numbers are per-tenant and sequential | `DECIDED` |
| OF10 | Customer wording ≠ internal statuses | `DECIDED` |
| OF11 | Cart survives refresh | `PROPOSED` |
| OF12 | Cart is not visible to staff before submission | `DECIDED` |

---

## 9. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Double tap on submit | Idempotency key → one order | `DECIDED` |
| Network drop mid-request | Client retries with the same key; result identical | `DECIDED` |
| Network drop after server commit, before response | Retry returns the original order | `DECIDED` |
| Item sold out at submit time | Block, name the item | `DECIDED` |
| Price changed since adding to cart | Show current price at confirm; snapshot at submit | `PROPOSED` |
| Order rejected by staff | Show friendly rejection; customer may resubmit | `OPEN QUESTION` |
| Customer wants to cancel an order | Path unspecified | `OPEN QUESTION` |
| Two devices order on one table session simultaneously | Last-writer semantics must be defined | `OPEN QUESTION` |
| Order quantity above a limit | No limit defined; abuse mitigation `OPEN QUESTION` | `OPEN QUESTION` |
| Session closed while the cart is open | Warn before submit; block after | `PROPOSED` |
| Very large order (50 items) | No cap defined | `OPEN QUESTION` |
| Modifier price changed between add and submit | Snapshot the modifier price at submit | `PROPOSED` |

---

## 10. Security considerations

| Concern | Mitigation | Status |
|---|---|---|
| Order created against someone else's table | Approved session + unguessable session token | `DECIDED` |
| Replay of a submission | Idempotency key + scoped uniqueness | `DECIDED` |
| Price tampering by the client | Server resolves prices; client values are ignored | `DECIDED` (critical) |
| Forged availability | Server-side validation at submit | `DECIDED` |
| Order flooding / abuse | Rate limiting + anomaly detection | `OPEN QUESTION` |
| PII leakage into other tenants | Tenant scoping on read; optional data only | `DECIDED` |
| Order number enumeration | Per-tenant sequential numbers are fine; cross-tenant access is not | `DECIDED` |
| Session token in URLs vs. headers | `OPEN QUESTION` — affects referrer leakage | `OPEN QUESTION` |

**Critical rule:** the client must never be trusted for prices or totals. All monetary values are
computed server-side from live product data at submission, then frozen into snapshots.

---

## 11. Data implications

| Entity | Operation |
|---|---|
| Order | create |
| Order line item | create, with snapshot fields (name, price, options snapshot) |
| Customer Session | read/update |
| Table Session | read |
| Audit event | create (order submitted) |
| Idempotency record | create |
| Product availability | read (and decrement only if inventory exists — `FUTURE`) |

Snapshot fields are listed in [`../domain/order-system.md`](../domain/order-system.md) §Snapshots.

---

## 12. Current decision summary

`DECIDED`

Cart is a draft; submit creates an order; submission is idempotent and server-priced; line items are
snapshotted; multiple orders per session without re-approval; name/phone optional; customer wording
is separate from internal status; the bill aggregates all session orders.

---

## 13. Future considerations

- Modifiers/variants with their own pricing and stock.
- Scheduled/pre-orders.
- Customer-initiated order cancellation.
- Splitting an order across bills.
- Inventory-driven availability decrementing stock at order time.
- Kitchen-level item-level status shown to the customer.
- Tips/charges entered by staff.
- Reorder from history.

Constraints: [`../governance/future-features.md`](../governance/future-features.md).

---

## 14. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Order cancellation rules — who can cancel, when, and with what customer-facing outcome | **Yes** |
| Q2 | Is there a `REJECTED` status distinct from `CANCELLED`? | Yes — state machine |
| Q3 | Rate limits for order submission | Yes (security) |
| Q4 | Multi-device simultaneous ordering on one session | No (MVP is single device) |
| Q5 | Maximum order size / item quantity caps | No |
| Q6 | Does submitting an order auto-advance it to `CONFIRMED`, or does staff confirm? | Yes |
| Q7 | Cart persistence: client-only or server-side | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).