# Order System

The structure of an order, its line items, its snapshots, its numbering, and its cancellation.

Related: [`../flows/ordering-flow.md`](../flows/ordering-flow.md) ·
[`../domain/order-state-machine.md`](../domain/order-state-machine.md) ·
[`../technical/idempotency.md`](../technical/idempotency.md) ·
[`../platform/audit-log.md`](../platform/audit-log.md)

---

## 1. What it is

A submitted request to buy one or more products for a table session: the header, its line items, their
frozen snapshots, its identifier, and its lifecycle.

**Who uses it:** the customer (creates), staff (view, progress, cancel), the system (calculates).

---

## 2. Why it exists

- A structured order is the record of *what was ordered, by which table, at what price, when*.
- It is the input to the bill, to station routing, to kitchen queues, and to analytics.
- Voice/notepad ordering loses exactly this information.

---

## 3. Order vs. cart

`DECIDED`

| | Cart | Order |
|---|---|---|
| Where | Client-side draft | Server, persisted |
| Visibility | Customer only | Customer + staff |
| Status | None | Full state machine |
| Enters the kitchen | No | Yes (on accept) |
| Billable | No | Yes |
| Immutable | No | Line item snapshots are immutable (P7) |

Terminology discipline matters here — see
[`../product/terminology.md`](../product/terminology.md) §Documented anti-terms.

---

## 4. Order structure

### 4.1 Header

`DECIDED`

| Field | Status | Notes |
|---|---|---|
| Internal ID | `DECIDED` | Never exposed |
| Tenant | `DECIDED` | Isolation boundary |
| Table session | `DECIDED` | Not the table — see table-management §5.2 |
| Order number (per-tenant, human-facing) | `DECIDED` | e.g. `#1021` |
| Status | `DECIDED` | See state machine |
| Customer name (optional) | `DECIDED` | May be null |
| Customer phone (optional) | `DECIDED` | May be null |
| Subtotal / total | `DECIDED` | Computed server-side |
| Placed at | `DECIDED` | UTC |
| Currency unit | `OPEN QUESTION` | Toman vs. Rial |
| Special instructions | `OPEN QUESTION` | e.g. «بدون یخ» |
| Source | `PROPOSED` | `CUSTOMER_APP` / `STAFF_ENTERED` — needed if staff order entry exists |

### 4.2 Line items

`DECIDED`

| Field | Status | Notes |
|---|---|---|
| Product reference | `DECIDED` | May point to an archived product |
| Quantity | `DECIDED` | Positive integer |
| **Snapshot: product name** | `DECIDED` | P7 |
| **Snapshot: unit price** | `DECIDED` | P7 |
| **Snapshot: product description** | `PROPOSED` | Useful on printed bills |
| **Snapshot: chosen options/modifiers** | `DECIDED` (reserved) | P8 |
| **Snapshot: modifier prices** | `DECIDED` (reserved) | |
| Line total | `DECIDED` | Computed at submission |
| Station assignment | `FUTURE` (reserved) | Derived at submission time, not live |
| Item-level status | `FUTURE` | For partial fulfilment |

---

## 5. Snapshots — the core data rule

`DECIDED` (principle P7)

### 5.1 The rule

```
Product price today:       120,000
Price when ordered:        100,000
→ the old order remains    100,000
```

Changing a product's current price **must not** modify historical orders. Period.

### 5.2 Why

- The restaurant's revenue history must be truthful.
- The customer's bill must match what they agreed to.
- Reporting must not silently change retroactively.
- Dispute resolution requires an immutable record.

### 5.3 What must be snapshotted

`DECIDED` (name + price) · `DECIDED` (options snapshot reserved) · `PROPOSED` (description, image at
order time)

| Item | Status |
|---|---|
| Product name | `DECIDED` |
| Unit price | `DECIDED` |
| Options/modifiers with prices | `DECIDED` (reserved) |
| Description | `PROPOSED` |
| Image reference | `PROPOSED` |
| Category name | `PROPOSED` (for grouped bills) |

### 5.4 Rules

1. Snapshots are written **once**, at submission.
2. No process may update a snapshot.
3. The order's displayed values come from snapshots, never from a live product join.
4. Station assignment is also frozen at submission — if routing changes tomorrow, old orders keep their
   original routing.

### 5.5 The anti-pattern

```
❌ Bill reads: SELECT product.price FROM orders JOIN products ...
✅ Bill reads: orders_line.unit_price_snapshot
```

This is the single most likely data-integrity bug in this product. It is called out explicitly so it is
reviewed at every order-read site.

---

## 6. Order numbers

`DECIDED`

- Human-facing, sequential, **per tenant** (Restaurant A's `#1021` need not relate to B's).
- Used verbally across the counter — "order 1021" must mean one thing.
- The internal ID is separate and never shown.

**`OPEN QUESTION`:** format (`#1021` vs `1021`), daily reset, width, and gaps on cancellation. Daily
reset is common in restaurants (staff think in days) but creates duplicate numbers across days —
recorded in `governance/open-questions.md#product`.

---

## 7. Submission

`DECIDED` — see [`../flows/ordering-flow.md`](../flows/ordering-flow.md) §4

Guards: approved session, session open, items available, valid quantities, at least one line,
idempotency key unused.

**Client-supplied prices are ignored.** The server resolves prices from live product data, then
snapshots them. This is a security control, not a preference.

---

## 8. Multiple orders per session

`DECIDED`

An approved session can hold many orders. No re-approval. The bill aggregates all of them.

**`OPEN QUESTION`:** are items ever merged into an existing open order instead of creating a new one?
Recommended: no — each submit is its own order, matching real restaurant behaviour ("one ticket per
round").

---

## 9. Cancellation

**`OPEN QUESTION` — this is a genuine gap in the specification.**

The brief's lifecycle (PENDING → … → CLOSED) contains **no cancellation status**, yet §25 of the brief
uses order cancellation as an audit example, and §36 lists "order cancellation" as a future problem.

### 9.1 Questions

| Question | Notes |
|---|---|
| Is there a `CANCELLED` status? | Almost certainly yes |
| Is there a separate `REJECTED` status? | Different meaning: never accepted vs. withdrawn after acceptance |
| Which roles may cancel? | `OPEN QUESTION` |
| When may an order be cancelled? | Before preparation? Any time? |
| Is a reason required? | `DECIDED` that it is recorded (S7) |
| Is the customer notified? | `OPEN QUESTION` |
| What happens to the bill? | Cancelled items must be excluded |
| Is a cancelled order's number reused? | Recommended: never |
| Is a cancellation reversible? | Recommended: no; re-order instead |

### 9.2 Recommendation (`PROPOSED`, not decided)

```
PENDING   → REJECTED   (staff declines; nothing was started)
any active → CANCELLED (staff or customer-initiated, with reason)
```

Both terminal. Both excluded from the bill. Both audited. Both preserve the order row for history.

---

## 10. Business rules

| # | Rule | Status |
|---|---|---|
| OS1 | An order belongs to exactly one table session | `DECIDED` |
| OS2 | An order belongs to exactly one tenant | `DECIDED` |
| OS3 | Line items store name/price/options snapshots, written once | `DECIDED` |
| OS4 | Historical orders never change when the menu changes | `DECIDED` |
| OS5 | Order numbers are per-tenant and sequential | `DECIDED` |
| OS6 | Order submission is idempotent | `DECIDED` |
| OS7 | Prices are resolved server-side | `DECIDED` |
| OS8 | Quantities are positive integers | `DECIDED` |
| OS9 | Cancelled/rejected orders never contribute to the bill | `PROPOSED` |
| OS10 | Cancellation records actor, time, and reason | `DECIDED` (P19) |
| OS11 | Customer personal data is optional | `DECIDED` |
| OS12 | The order model must accommodate options | `DECIDED` (P8) |

---

## 11. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Product archived after ordering | Order unaffected (snapshot); product shown archived in staff UI | `DECIDED` |
| Product deleted (hard) after ordering | Must not be possible (menu-system §6) | `DECIDED` |
| Price changed after ordering | Order unchanged | `DECIDED` |
| Quantity edited after ordering | Not permitted; cancel and re-order | `PROPOSED` |
| Order number collision | Per-tenant sequence; retry-safe allocation | `PROPOSED` |
| Duplicate submission | Idempotency key | `DECIDED` |
| Order submitted at the moment the session closes | Rejected with a clear message | `PROPOSED` |
| Very large quantity (999) | No cap defined; abuse control `OPEN QUESTION` | `OPEN QUESTION` |
| Empty cart submitted | Rejected | `PROPOSED` |
| Unicode/long product names | Must not break totals or the UI | `PROPOSED` |
| Options price changed mid-session | Snapshot at submit | `DECIDED` |
| Two orders contain the same product | Separate line items; may merge for the bill | `PROPOSED` |
| Order submitted by staff on behalf of a customer | `OPEN QUESTION` — affects `source` and audit | `OPEN QUESTION` |

---

## 12. Security considerations

| Concern | Control | Status |
|---|---|---|
| Client-supplied prices/totals | Ignored; server-computed | `DECIDED` |
| Order placed against an unapproved session | Server rejects | `DECIDED` |
| Order placed against another tenant | Tenant scoping | `DECIDED` |
| Order number enumeration | Per-tenant numbering only; authorization on read | `DECIDED` |
| Replay of a submission | Idempotency key | `DECIDED` |
| Staff cancelling orders to steal from a shift total | Audit log | `DECIDED` |
| PII exposure in staff views | Only what is needed; role-scoped | `DECIDED` |
| Mass assignment of `tenant_id` / `status` | Strict field allowlists | `DECIDED` |
| Reordering an order into another table | Requires an explicit audited transfer, not a field update | `PROPOSED` |

---

## 13. Data implications

| Entity | Key fields |
|---|---|
| **Order** | id, tenant_id, table_session_id, order_number, status, customer_name?, customer_phone?, subtotal, total, placed_at, decided_at?, source, currency_unit |
| **Order line item** | id, order_id, product_id, quantity, unit_price_snapshot, name_snapshot, options_snapshot, line_total, station_snapshot |
| *(reserved)* | item_status, cancellation_reason, cancellation_actor |

**Indexes:** `(tenant_id, table_session_id)`; `(tenant_id, status, placed_at)` for the order board;
`(tenant_id, order_number)` unique.

**Order number allocation** must be concurrency-safe. `PROPOSED`: a per-tenant sequence, or
`max+1` under a transaction with retry. Documented because it is a classic source of duplicate-key bugs
at peak hours.

---

## 14. Current decision summary

`DECIDED`

An order belongs to a table session and a tenant. Line items freeze name, price, and options at
submission. Order numbers are per-tenant and sequential. Submission is idempotent and server-priced.
Personal data is optional. Cancellation is recorded with actor and reason.

**Not decided:** cancellation/rejection statuses and policy, order number format, special instructions,
staff-entered orders, quantity caps.

---

## 15. Future considerations

| Feature | Constraint on today's design |
|---|---|
| Order splitting across bills | Line items must be allocatable to a bill |
| Item-level status | Status at line-item level, not only order level |
| Kitchen/bar station routing | Station frozen at submission; order may span stations |
| Inventory decrement | Needs a stock concept and transaction boundary |
| Scheduled orders | Needs a scheduled-for timestamp and a distinct session type |
| Tips/service | Additional bill components, not a new field on the order |
| Customer reordering | Requires reading past line items |
| Tips per item | Needs line-level adjustments |
| Delivery/courier | Statuses beyond DELIVERED |

---

## 16. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Cancellation vs. rejection statuses and policy | **Yes — state machine** |
| Q2 | Order number format (daily reset?) | No |
| Q3 | Special instructions on a line item | No |
| Q4 | Staff-entered orders | No |
| Q5 | Maximum quantity / order size | No |
| Q6 | Do orders merge into an open ticket, or always create a new one? | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).