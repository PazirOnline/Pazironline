# User Flows — Master Map

The narrative index. Every detailed flow doc links back here.

---

## 1. Actors

| Actor | Authenticated? | Interface | Persian label |
|---|---|---|---|
| **Customer (one diner per table)** | No | Customer web app, phone, RTL | مشتری |
| **Owner** | Yes | Staff web app | مالک |
| **Manager** | Yes | Staff web app | مدیر |
| **Cashier** | Yes | Staff web app | صندوق‌دار |
| **Waiter** | Yes | Staff web app | سرویس |
| **Kitchen** | Yes | Station view | آشپزخانه |
| **Barista** | Yes | Station view | باریستا |
| **System** | — | — | سامانه |

---

## 2. The one-line story

`DECIDED`

> A customer scans a static QR, browses the menu freely, asks for ordering access once, gets approved
> by staff, orders repeatedly for the whole table, watches their order progress, reviews the bill, and
> pays at the cashier.

---

## 3. Macro flow map

```
                     ┌──────────────────────────────────────┐
                     │        ENTRANCE QR (optional)        │
                     │   /r/{slug}  → menu only, no table   │
                     └──────────────────┬───────────────────┘
                                        │
                        ┌───────────────┴───────────────┐
                        │  Customer scans (menu + table)│
                        │  /r/{slug}                   │
                        │  /r/{slug}/t/{tableToken}     │
                        └───────────────┬───────────────┘
                                        ▼
                              ┌───────────────────┐
                              │  MENU BROWSING    │  ← no permission required
                              │  categories        │
                              │  products          │
                              │  prices/availability│
                              └─────────┬─────────┘
                                        │ customer chooses to order
                                        ▼
                              ┌───────────────────┐
                              │ REQUEST ORDERING  │
                              │  ACCESS           │
                              │  (no account)     │
                              └─────────┬─────────┘
                                        ▼
                              ┌───────────────────┐
                              │ «در انتظار تأیید» │  ← waiting state
                              └─────────┬─────────┘
                                        │ staff approves (ONE tap, ONE per session)
                     ┌──────────────────┴──────────────────┐
                     │ Staff device                        │ Customer device
                     ▼                                     ▼
        ┌────────────────────────┐              ┌────────────────────────┐
        │  Approval queue         │              │  APPROVED → can order  │
        │  table + wait time      │              │  Order · · · · ·      │
        │  [Approve] [Reject]     │              │  Order · · · · ·      │
        └────────────────────────┘              └───────────┬────────────┘
                                                             │
        ┌────────────────────────────────────────────────────┤
        │                     STAFF SIDE                       │
        │  Order board → Kitchen/Bar queues → Delivery → Bill│
        │  (real-time status changes push to customer)        │
        └────────────────────────────────────────────────────┘
                                                             ▼
                                              ┌────────────────────────┐
                                              │  BILL VIEW             │
                                              │  items, discounts,     │
                                              │  grand total           │
                                              └───────────┬────────────┘
                                                          ▼
                                              ┌────────────────────────┐
                                              │  PAY AT CASHIER        │
                                              │  (physical, no online) │
                                              │  settlement recorded   │
                                              └───────────┬────────────┘
                                                          ▼
                                              ┌────────────────────────┐
                                              │  SESSION CLOSED        │
                                              │  → future analytics    │
                                              └────────────────────────┘
```

---

## 4. Flow index

| # | Flow | Doc | Primary actor |
|---|---|---|---|
| F1 | Customer entry & browsing | [`customer-flow.md`](customer-flow.md) | Customer |
| F2 | Requesting ordering access & approval | [`customer-flow.md`](customer-flow.md) §4, [`../domain/approval-system.md`](../domain/approval-system.md) | Customer + staff |
| F3 | Building a cart & submitting an order | [`ordering-flow.md`](ordering-flow.md) | Customer |
| F4 | Order status tracking | [`ordering-flow.md`](ordering-flow.md) §6 | Customer |
| F5 | Bill review & payment | [`ordering-flow.md`](ordering-flow.md) §7, [`../domain/billing.md`](../domain/billing.md) | Customer + cashier |
| F6 | Staff authentication | [`staff-flow.md`](staff-flow.md) §2 | Staff |
| F7 | Approving a table session | [`staff-flow.md`](staff-flow.md) §3 | Waiter/Cashier |
| F8 | Triage and progress orders | [`staff-flow.md`](staff-flow.md) §4 | Staff |
| F9 | Kitchen/bar production | [`../domain/kitchen-and-bar.md`](../domain/kitchen-and-bar.md) | Kitchen/Barista |
| F10 | Delivery confirmation | [`staff-flow.md`](staff-flow.md) §5 | Waiter |
| F11 | Settlement | [`../domain/billing.md`](../domain/billing.md) | Cashier |
| F12 | Table management (staff) | [`../domain/table-management.md`](../domain/table-management.md) | Staff |
| F13 | Menu management (staff) | [`../domain/menu-system.md`](../domain/menu-system.md) | Owner/Manager |
| F14 | Subscription management (platform) | [`../platform/subscriptions.md`](../platform/subscriptions.md) | Owner + Platform |

---

## 5. Entry points

`DECIDED`

| Entry | URL | Gives | Table context? |
|---|---|---|---|
| Entrance / general QR | `/r/{slug}` | Menu only | No |
| Table QR | `/r/{slug}/t/{tableToken}` | Menu **and** table context | Yes |
| Deep link from a printed table card | same as table QR | Same | Yes |
| Custom domain (future) | `{customDomain}/...` | Same, tenant resolved by host | `FUTURE` |

**Important:** scanning a table QR does **not** grant ordering permission. It only establishes table
context. See [`../domain/approval-system.md`](../domain/approval-system.md).

---

## 6. Customer journey, happy path

`DECIDED` (structure), `PROPOSED` (timings)

| Step | Actor | Action | System response | Time |
|---|---|---|---|---|
| 1 | Customer | Scans table QR | Tenant + table resolved, Customer Session created | 0s |
| 2 | Customer | Browses menu | Menu loads fast, images lazy | 0–3s |
| 3 | Customer | Taps "order" | Ordering access request created | — |
| 4 | Customer | Sees «در انتظار تأیید» | Session = `PENDING_APPROVAL` | — |
| 5 | Waiter | Sees table in approval queue | Push notification / queue entry | seconds |
| 6 | Waiter | Taps **Approve** | Session = `APPROVED`, customer notified | 1 tap |
| 7 | Customer | Sees approved state | Ordering unlocked | ~1s |
| 8 | Customer | Adds items, submits order #1021 | Order created `PENDING`, idempotent | — |
| 9 | Customer | Adds items, submits order #1022 | Order created | — |
| 10 | Kitchen/Bar | Work the queues | Status → `PREPARING` → `READY` | minutes |
| 11 | Waiter | Delivers | Status → `DELIVERED` | minutes |
| 12 | Customer | Reviews bill | Bill computed from all session orders | — |
| 13 | Customer | Pays at cashier | Settlement recorded, status → `PAID` | — |
| 14 | Cashier | Closes session | Session `CLOSED` | — |

**Key property (`DECIDED`):** steps 8–9 require no further approval. One approval unlocks the whole
visit. See P4 in [`../product/product-principles.md`](../product/product-principles.md).

---

## 7. Customer journey, failure paths

| Situation | Behaviour | Status |
|---|---|---|
| Scans QR, no table context (entrance QR) | Menu only; ordering request needs a table | `DECIDED` |
| Scans a QR that's been deleted/archived | Friendly "this table is not in use" page | `PROPOSED` |
| Requests access, staff never approve | Waiting state persists; staff notified; no auto-approve | `DECIDED` |
| Requests access, staff reject | Clear message; can re-request (rate-limited) | `PROPOSED` |
| Network drops mid-submission | Retry with same idempotency key → no duplicate order | `DECIDED` |
| Network drops after approval | Session survives; reconnect shows approved state | `DECIDED` |
| Session expires while browsing | Re-establish from the table token | `PROPOSED` |
| Product becomes unavailable after being added to cart | Block at submission with a clear message | `PROPOSED` |
| Price changed after being added to cart | Show current price at confirmation; snapshot at submit | `PROPOSED` |
| Page refreshed mid-order | Session survives (C12) | `DECIDED` |
| Closed the tab entirely and reopened the menu | Session survives on the device | `DECIDED` |

---

## 8. Staff journey, happy path

`DECIDED` (structure), `PROPOSED` (specific screens)

| Step | Actor | Action |
|---|---|---|
| 1 | Staff | Authenticate |
| 2 | Waiter/Cashier | Open approval queue → see Table 8 waiting 40s → tap **Approve** |
| 3 | Cashier/Waiter | See new order on the order board |
| 4 | Kitchen/Barista | Item appears in their station queue |
| 5 | Kitchen/Barista | Mark ready |
| 6 | Waiter | Mark delivered |
| 7 | Cashier | Present bill, take cash, record settlement |
| 8 | Cashier/Manager | Close table session |

---

## 9. Cross-cutting invariants

These hold in **every** flow. A design that violates one of these is wrong.

| # | Invariant | Ref |
|---|---|---|
| I1 | Menu browsing never requires permission | P5 |
| I2 | Ordering always requires an approved session | P3 |
| I3 | Approval is per session, once | P4 |
| I4 | Customer never creates an account | P5 |
| I5 | Tenant data never crosses tenants | P2 |
| I6 | Historical order values never change | P7 |
| I7 | Duplicate submissions never duplicate orders | P10 |
| I8 | Internal IDs are never in customer-facing URLs/QRs | P6 |
| I9 | Customer sees customer-friendly wording, not internal statuses | P10 |
| I10 | Offline is never designed for | P9 |
| I11 | Every important action is attributable | P19 |
| I12 | No feature assumes a printer or monitor exists | P16 |

---

## 10. Where flows are still undefined

See [`../governance/open-questions.md`](../governance/open-questions.md). The most consequential
flow-level unknowns:

- What happens when a table is occupied but nobody scans?
- How long does an approved session stay valid? (`OPEN QUESTION` — blocking, it defines the security
  model)
- Can a customer order for a table they're not sitting at, once approved? (accepted risk?)
- What does a customer see after the session closes?
- Rejection flow, rate limits, and abuse messaging are unspecified.
- Menu-change → what a customer mid-session sees.

---

## 11. Related documents

- [`customer-flow.md`](customer-flow.md) · [`ordering-flow.md`](ordering-flow.md) ·
  [`staff-flow.md`](staff-flow.md)
- [`../domain/order-state-machine.md`](../domain/order-state-machine.md)
- [`../domain/approval-system.md`](../domain/approval-system.md)
- [`../domain/customer-sessions.md`](../domain/customer-sessions.md)
- [`../technical/qr-system.md`](../technical/qr-system.md)