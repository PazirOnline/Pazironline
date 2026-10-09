# Analytics and Data Preservation

**Nothing is built in the MVP.** This document exists so that the data we *do* capture now is clean
enough to build future analytics on without a data migration.

Related: [`../domain/order-system.md`](../domain/order-system.md) ·
[`../platform/audit-log.md`](../platform/audit-log.md) · [`../domain/billing.md`](../domain/billing.md)

---

## 1. What this document is

A record of which future analyses the founders expect to want, and what data each requires — so we can
decide, at design time, what to capture.

`DECIDED` (from the brief): *"The system should preserve enough clean structured data to support future
analytics. Do not build a huge analytics system in the MVP unless explicitly requested."*

---

## 2. Expected future reports

`DECIDED` (the founders listed these)

| Report | Natural source |
|---|---|
| Daily sales | Orders + settlements |
| Monthly sales | Orders + settlements |
| Best-selling products | Order line items |
| Product performance | Order line items + product snapshots |
| Orders by hour | `placed_at` |
| Popular categories | Line items + category snapshots |
| Product views vs. orders | Menu view events + orders |
| Revenue trends | Orders + settlements |
| Branch comparisons | Requires the branch dimension |

---

## 3. The rule

`PROPOSED`

> If a future report is listed above, the data for it must be captured correctly **today**, in the
> ordinary transactional tables. No special analytics store is needed for MVP.

**Corollary:** the order line item must snapshot the **category name** as well as the product name and
price. Otherwise, renaming a category rewrites history and breaks "popular categories over time".

---

## 4. Data we must preserve

| Data | Why | Needed for |
|---|---|---|
| `placed_at` | Timing | Orders by hour, trends, peak analysis |
| Per-milestone timestamps (`confirmed_at`, `ready_at`, `delivered_at`, `paid_at`) | Duration analysis | Preparation time, throughput, SLA |
| Quantity per line | Volume | Best sellers |
| Unit price snapshot | Revenue at time of sale | Accurate revenue |
| Product name snapshot | Labels | Reports after rename |
| Category name snapshot | Grouping | Popular categories |
| Options snapshot | Item mix | Modifier analysis |
| Station snapshot | Where work happens | Kitchen vs. bar load |
| Order status + history | Funnel | Conversion, cancellations |
| Cancellation reason | Diagnosis | Why orders fail |
| Discount amounts and reasons | Margin | Discount impact |
| Settlement amounts and method | Realised revenue | Revenue truth |
| Customer session id | Link orders to a visit | Repeat behaviour, abuse |
| Table id (via session) | Granularity | Per-table performance |
| Tenant id | Isolation | Everything |

---

## 5. Product view events

`OPEN QUESTION` — the brief lists *"product views vs. orders"* as a desired report, which requires
tracking menu views.

| Question | Notes |
|---|---|
| Track product views at all? | Privacy + volume + complexity cost |
| Client-side only, or server-side? | Client-side analytics undercount |
| What granularity — category view, product view, or cart add? | |
| Retention | |
| Consent | Even anonymous analytics may need a notice |

**Recommendation (`PROPOSED`):** do **not** build product-view tracking in the MVP. Note that it is
wanted, and design the menu read API so it can be instrumented later. Adding view tracking later is
easier than retrofitting privacy expectations.

---

## 6. Why clean structured data matters more than an analytics tool

`PROPOSED`

The failure mode to avoid: building a pretty dashboard on top of denormalized, lossy data, and then
discovering that "revenue" doesn't reconcile with settlements, or that renaming a product broke last
quarter's report.

Rules:

1. **One source of truth** for money: settlements, not order totals.
2. **Snapshots over joins** for historical labels and prices.
3. **Store timestamps you might group by**, at the moment the event happens.
4. **Don't aggregate away the detail** — store row-level facts; aggregate at query time (or in views).
5. **Tenant-scoped** everywhere, so cross-tenant reports are possible only for the platform.

---

## 7. Deliberately not built

`DECIDED`

- ❌ Analytics dashboards in the MVP
- ❌ A separate data warehouse
- ❌ An events pipeline
- ❌ A/B testing infrastructure
- ❌ Real-time dashboards for owners

**Explicitly out of scope** unless requested.

---

## 8. Future features that need decisions made now

| Future feature | Data requirement today |
|---|---|
| Daily/monthly sales reports | Timestamps + settled amounts |
| Best sellers | Quantity + name snapshot |
| Peak hours | `placed_at` |
| Preparation-time analytics | Per-status timestamps |
| Branch comparison | Branch dimension (see multi-tenancy §8) |
| Product views vs. orders | View events (`OPEN QUESTION` §5) |
| Discount impact | Discount entity with amounts/reasons |
| Staff performance | Actor on status transitions |
| Churn analysis | Subscription state history |
| Menu change impact | Price/availability change history (`OPEN QUESTION` — menu-system §9.2) |

---

## 9. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Track product views for MVP? | **No — but decide before customers see it** |
| Q2 | Price-change history table needed? | No |
| Q3 | Analytics/audit retention vs. operational retention | No |
| Q4 | Is the analytics audience only the restaurant owner, or also the platform? | No |
| Q5 | Branch dimension availability (blocked by the tenant/brand question) | See multi-tenancy |
| Q6 | Timezone for "daily" reports (restaurant local vs. UTC) | **Yes — affects stored timestamps' meaning** |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).