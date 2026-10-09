# Order State Machine

The complete order lifecycle: every internal status, every valid transition, every invalid transition,
and the customer-facing wording for each.

Related: [`order-system.md`](order-system.md) · [`../flows/ordering-flow.md`](../flows/ordering-flow.md) ·
[`../flows/staff-flow.md`](../flows/staff-flow.md)

---

## 1. What it is

The definition of an order's lifecycle as a state machine: legal transitions, who may trigger them,
and how each state is presented to the customer.

**Who uses it:** the system (enforcement), staff (actions), the customer (status view).

---

## 2. Why it exists

An order with no defined lifecycle is a support incident waiting to happen. The state machine:

1. Makes the pipeline explicit and testable.
2. Prevents nonsense (delivering an order that was never prepared).
3. Gives the customer a truthful, calm progress indicator.
4. Gives staff a clear "what can I do now?" answer.

---

## 3. The two-layer status model

`DECIDED`

This is a deliberate architectural decision and must not be collapsed.

```
INTERNAL STATUS (machine truth)   ≠   CUSTOMER-FACING WORDING (presentation)
```

**Why separate:**

- Internal statuses are stable identifiers for the API, database, and logic.
- Customer wording is friendly Persian and may be merged, reordered, or reworded for UX without touching
  logic.
- Some internal states (e.g. `CLOSED`) are not shown to customers at all.
- Exposing technical status names would read as a machine talking, not a restaurant.

`DO NOT ASSUME` — the mapping is not 1:1 and may change. Never derive customer copy from an internal
enum in more than one place.

---

## 4. Internal statuses

`DECIDED` (the six given) · `OPEN QUESTION` (the three added)

| Status | Meaning | Terminal? |
|---|---|---|
| `PENDING` | Submitted, awaiting staff acceptance | No |
| `CONFIRMED` | Accepted by staff, not yet started | No |
| `PREPARING` | Being made | No |
| `READY` | Made, awaiting delivery | No |
| `DELIVERED` | Delivered to the table | No |
| `PAID` | Settlement recorded | No |
| `CLOSED` | Terminal, archived | **Yes** |
| `CANCELLED` | Withdrawn | `OPEN QUESTION` |
| `REJECTED` | Declined before starting | `OPEN QUESTION` |

### 4.1 Why `CANCELLED` / `REJECTED` are marked OPEN

The brief's lifecycle omits them, but the brief also requires auditing order cancellation (§25) and
lists cancellation as a concern (§36). Omitting them makes cancellation impossible to model honestly.

This is recorded as a **specification gap**, not an invention. See
[`../governance/contradictions-and-risks.md`](../governance/contradictions-and-risks.md) §1.

`PROPOSED` resolution — two distinct states:

- `REJECTED`: staff declined; production never started; nothing to make.
- `CANCELLED`: withdrawn after acceptance; may have partial work done.

If the founders prefer a single terminal state, that is acceptable — but one of them must exist.

---

## 5. Customer-facing wording

`PROPOSED` (exact copy is a UX decision) · the *separation* is `DECIDED`

| Internal | Customer-facing (proposed) | Notes |
|---|---|---|
| `PENDING` | سفارش ثبت شد | Immediate reassurance |
| `CONFIRMED` | سفارش تأیید شد | The kitchen has it |
| `PREPARING` | در حال آماده‌سازی | |
| `READY` | تقریباً آماده است | Softer moment before «آماده تحویل» |
| `READY` (firm) | آماده تحویل | |
| `DELIVERED` | تحویل شد | |
| `PAID` | پرداخت شد | |
| `CLOSED` | — | Not shown |
| `CANCELLED` | لغو شد | `OPEN QUESTION` |
| `REJECTED` | سفارش انجام نشد | `OPEN QUESTION` — avoid the harsh «رد شد» |

**Requirements (`DECIDED`):** status must be distinguishable by **icon + label + colour**, never colour
alone (design-system §5.3). Copy must never promise a time we cannot keep.

---

## 6. The state diagram

```
                        ┌──────────────┐
                        │   PENDING    │  submitted
                        └──────┬───────┘
                               │ staff confirms
                               ▼
     ┌─────────────┐     ┌──────────────┐
     │  REJECTED   │◄────┤  CONFIRMED   │  accepted
     └─────────────┘     └──────┬───────┘
          terminal               │ station starts
                                 ▼
                          ┌──────────────┐
                          │  PREPARING   │
                          └──────┬───────┘
                                 │ items ready
                                 ▼
                          ┌──────────────┐
                          │    READY     │
                          └──────┬───────┘
                                 │ waiter delivers
                                 ▼
                          ┌──────────────┐
                          │  DELIVERED   │
                          └──────┬───────┘
                                 │ settlement recorded
                                 ▼
                          ┌──────────────┐
                          │    PAID      │
                          └──────┬───────┘
                                 │ session closed
                                 ▼
                          ┌──────────────┐
                          │    CLOSED    │  terminal
                          └──────────────┘

  ┌─────────────┐
  │  CANCELLED  │◄──── from PENDING, CONFIRMED, PREPARING, READY, DELIVERED
  └─────────────┘  terminal
```

---

## 7. Transition table

`DECIDED` (structure) · `OPEN QUESTION` (specific permissions)

| # | From | To | Trigger | Actor | Notes |
|---|---|---|---|---|---|
| T1 | — | `PENDING` | Customer submits | Customer | Idempotent |
| T2 | `PENDING` | `CONFIRMED` | Accept | Waiter/Cashier/Manager | |
| T3 | `PENDING` | `REJECTED` | Decline | Waiter/Cashier/Manager | `OPEN QUESTION` |
| T4 | `CONFIRMED` | `PREPARING` | Start production | Kitchen/Barista/Waiter | |
| T5 | `PREPARING` | `READY` | Ready | Kitchen/Barista | |
| T6 | `READY` | `DELIVERED` | Delivered | Waiter/Cashier/Manager | |
| T7 | `DELIVERED` | `PAID` | Settlement recorded | Cashier/Manager | |
| T8 | `PAID` | `CLOSED` | Session closed | Cashier/Manager | |
| T9 | `PENDING` | `CANCELLED` | Cancel | Cashier/Manager (+ reason) | `OPEN QUESTION` |
| T10 | `CONFIRMED` | `CANCELLED` | Cancel | Cashier/Manager (+ reason) | `OPEN QUESTION` |
| T11 | `PREPARING` | `CANCELLED` | Cancel | Manager (+ reason) | `OPEN QUESTION` — food already made |
| T12 | `READY` | `CANCELLED` | Cancel | Manager (+ reason) | `OPEN QUESTION` |
| T13 | `DELIVERED` | `CANCELLED` | Void | Manager (+ reason) | `OPEN QUESTION` — disputes |
| T14 | `CANCELLED` | — | — | — | Terminal |
| T15 | `REJECTED` | — | — | — | Terminal |
| T16 | `CLOSED` | — | — | — | Terminal |

### 7.1 Explicitly invalid transitions

`DECIDED` as a rule — these must be rejected server-side:

| Attempt | Why invalid |
|---|---|
| `PENDING` → `READY` | Skips acceptance and preparation |
| `PENDING` → `DELIVERED` | Skips everything |
| `PENDING` → `PAID` | Payment for an order never made |
| `CONFIRMED` → `DELIVERED` | Skips preparation |
| `READY` → `PREPARING` | Backwards |
| `DELIVERED` → `PREPARING` | Already served |
| `PAID` → `CANCELLED` | Financial integrity — needs a reversal, not a cancellation |
| `CLOSED` → anything | Terminal |
| `CANCELLED` → `PREPARING` | Resurrecting a cancelled order |
| Any → `PAID` except from `DELIVERED` | Settlement requires delivery |
| Any cross-tenant transition | Isolation violation |

**Rule:** a transition not in the table is not implemented. There is no generic "set status" endpoint.

---

## 8. Automatic vs. manual transitions

`OPEN QUESTION`

| Transition | Currently |
|---|---|
| `—` → `PENDING` | Automatic (submission) |
| `PENDING` → `CONFIRMED` | `OPEN QUESTION` — manual staff accept, **or** automatic? |
| `CONFIRMED` → `PREPARING` | Probably manual (station starts) — or automatic on print/accept |
| `PREPARING` → `READY` | Manual per station, or automatic per item |
| `READY` → `DELIVERED` | Manual |
| `DELIVERED` → `PAID` | Manual (cashier) |
| `PAID` → `CLOSED` | Manual or automatic with session close |

### 8.1 The important question: does `PENDING` need staff confirmation?

`OPEN QUESTION` — **product decision with real trade-offs.**

| Option | Upside | Downside |
|---|---|---|
| Auto-confirm on submit | Customer sees «در حال آماده‌سازی» immediately; fewer taps for staff | No rejection path — the restaurant cannot decline a request it can't fulfil |
| Manual confirm | Kitchen control; restaurant can refuse out-of-stock items | Extra staff taps; customer waits; risk orders sit unnoticed |

**Middle ground (`PROPOSED`):** auto-confirm on submit, with a fast "reject/cancel" path available to
staff. The rejection path preserves the control without adding a mandatory step.

Note this is separate from **approval** — approval gates *whether an order can be placed at all*;
confirmation gates *whether this specific order proceeds*. They are different concepts at different
stages.

---

## 9. Business rules

| # | Rule | Status |
|---|---|---|
| SM1 | Only defined transitions are possible | `DECIDED` |
| SM2 | Terminal states are final | `DECIDED` |
| SM3 | `CLOSED` is not customer-visible | `PROPOSED` |
| SM4 | Customer wording is decoupled from internal status | `DECIDED` |
| SM5 | Every transition records actor, timestamp, from, to | `DECIDED` (P19) |
| SM6 | Every transition is authorised server-side | `DECIDED` |
| SM7 | Transitions are tenant-scoped | `DECIDED` |
| SM8 | Cancelled/rejected orders are excluded from the bill | `PROPOSED` |
| SM9 | Status is never set directly by a client | `DECIDED` |
| SM10 | Concurrent conflicting transitions resolve deterministically | `PROPOSED` |

---

## 10. Edge cases

| Edge case | Proposed handling | Status |
|---|---|---|
| Two staff press "ready" simultaneously | Second is a benign no-op | `PROPOSED` |
| Staff skips a state to save time | Blocked; offer the correct next action instead | `DECIDED` |
| Order never confirmed (staff forgot) | Appears at the top of the order board by age; a stale-order nudge | `PROPOSED` |
| Customer leaves before delivery | Auto-expire or staff close | `OPEN QUESTION` |
| Session closed with undelivered orders | Block closure or force-cancel with a reason | `OPEN QUESTION` |
| Order deleted by mistake | No delete; cancel with reason | `DECIDED` |
| Order cancelled after the customer paid | Disallowed; needs a refund/reversal concept `FUTURE` | `OPEN QUESTION` |
| Delivered but actually the wrong item | No dispute flow in MVP | `OPEN QUESTION` |
| Rejecting a multi-station order | Reject the whole order, not part of it | `PROPOSED` |
| A product becomes unavailable mid-preparation | Doesn't affect the placed order (snapshot) | `DECIDED` |
| Status pushed to a disconnected customer | Reconnect shows current truth | `DECIDED` |
| Order number reused after a daily reset | Prevent duplicates | `OPEN QUESTION` |
| Backdated orders | Rejected — `placed_at` is server-assigned | `DECIDED` |

---

## 11. Security considerations

| Concern | Control | Status |
|---|---|---|
| Client forcing a status (e.g. POST status=PAID) | No generic status endpoint; role-checked action endpoints only | `DECIDED` |
| Staff marking paid without authority | Role permission on the `PAID` transition | `DECIDED` |
| Cross-tenant status change | Tenant scoping on the target order | `DECIDED` |
| Cancel to hide theft | Audit log with actor + reason | `DECIDED` |
| Replay of a status change | Idempotent transitions | `PROPOSED` |
| Forged timestamps | Server assigns all times | `DECIDED` |

---

## 12. Data implications

| Entity | Key fields |
|---|---|
| **Order** | `status` (enum), `status_changed_at`, plus timestamps per milestone (`confirmed_at`, `preparing_at`, `ready_at`, `delivered_at`, `paid_at`, `closed_at`, `cancelled_at`) |
| **Order status event** | id, order_id, from_status, to_status, actor_staff_id, actor_role, reason?, created_at |
| **Audit event** | general audit sink |

**Recommendation (`PROPOSED`):** store both a current `status` column (fast reads) and an append-only
transition log (truth, analytics, and dispute resolution). Do not derive the current status by replaying
the log on every read.

Per-milestone timestamps are cheap now and expensive to backfill later — they directly power future
analytics ("average time from order to delivery").

**Indexes:** `(tenant_id, status)` for the board; `(tenant_id, status, placed_at)` for ageing queues.

---

## 13. Current decision summary

`DECIDED`

Six internal statuses in the given order: `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `DELIVERED`,
`PAID`, `CLOSED`. Only defined transitions are legal. Customer-facing wording is separate, friendly
Persian, and does not expose internal names. Every transition is authorised and audited.

**Not decided:** `CANCELLED`/`REJECTED` existence, manual vs. automatic confirm, who may perform each
transition, customer-initiated cancellation, settlement edge cases.

---

## 14. Future considerations

| Feature | Constraint on today's design |
|---|---|
| Item-level status | Status moves from order to line item; keep both |
| Partial delivery | `DELIVERED` may become partial |
| Multiple stations | One order spans stations; "ready" may be per-station |
| Split bill | Terminal states interplay with bill allocation |
| Refunds | Needs a reversal state, not a rewind |
| Kitchen time analytics | Requires milestone timestamps |
| SLA/alerts ("order waiting > 10 min") | Requires ageing queries |
| Disputes | Needs an order-level annotation/audit view |

---

## 15. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Do `CANCELLED` and `REJECTED` exist as separate states? | **Yes — implementation + bill** |
| Q2 | Is `PENDING` → `CONFIRMED` automatic or manual? | **Yes — UX + staff load** |
| Q3 | Which roles may perform each transition? | **Yes — RBAC** |
| Q4 | Can a customer cancel their own order? | **Yes — product** |
| Q5 | Can a session be closed with orders undelivered? | Yes |
| Q6 | When is an unconfirmed order considered abandoned? | No |
| Q7 | Order number daily reset? | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).