# Future Features

Everything anticipated but **not** in the MVP. For each: why it is expected, and the constraint it places
on today's design.

**This document protects future work.** If a current design decision would make a feature here
impossible, that decision is wrong.

Related: [`decision-log.md`](decision-log.md) ·
[`../product/product-principles.md`](../product/product-principles.md) (P8, P13)

---

## How to use this

| When | Do |
|---|---|
| Designing something today | Check its constraint column below |
| Building something today | Verify the constraint is actually satisfied |
| Planning a future feature | Read its constraint before writing code |
| Discovering a new future feature | Add it here |

**A feature only becomes real when it has a decision-log entry.**

---

## 1. Menu and catalog

### 1.1 Product modifiers, variants, and add-ons

**Expected:** Cappuccino with extra shot / almond milk / no sugar; pizza size / crust / extra cheese.

**Constraint on today's design:** the product model must not be permanently `name/price/description/image`.
Option groups must be child entities if they need pricing and reporting — **not** a JSON blob.
`DECIDED` that room must exist (D-021); **the modelling approach is an open question.**

### 1.2 Inventory-driven availability

**Expected:** stock levels, "sold out" derived from inventory rather than a manual flag.

**Constraint:** availability must remain a separate concept from stock, so the manual flag keeps working
when inventory arrives.

### 1.3 Scheduled availability

**Expected:** breakfast-only items, happy hours.

**Constraint:** the category/product model needs a time-window field eventually; don't make `is_available`
a non-extensible boolean.

### 1.4 Product tags, dietary info, allergens

**Constraint:** needs a tag entity; allergens are a compliance concern (open question W-9).

### 1.5 Featured / sponsored products

**Expected:** advertising revenue; a restaurant pays to boost an item.

**Constraint:** needs a sort-priority concept, and the customer UI must be able to label it honestly.

### 1.6 Multiple menu languages

**Constraint:** needs a translation structure. English internals (D-036) make this cleaner.

### 1.7 Cost price and margin reporting

**Constraint:** must never be exposed to the customer API.

### 1.8 Bulk menu import

**Expected:** onboarding friction is a commercial risk (R-14). Restaurants won't type 120 products.

**Constraint:** needs stable external identifiers and idempotent upsert.

---

## 2. Tables and sessions

### 2.1 Session transfer between tables

**Constraint:** session↔table binding must be mutable, and orders must follow the **session**, not the
table. `DECIDED` by design (order-system §9).

### 2.2 Table merge

**Constraint:** must allow multiple sessions to combine into one bill → one-open-session-per-table cannot be
a hard database constraint (contradictions §3).

### 2.3 Table split

**Constraint:** orders must be partitionable.

### 2.4 Split bill

**Expected:** four people, one table, split it.

**Constraint:** an order cannot be an indivisible billing unit; bill↔line-item allocation must be
possible. `PROPOSED` to build the allocation model now (D-037).

### 2.5 Multiple devices per table

**Constraint:** session↔table session must not be exclusive at the DB level. `DECIDED` that the MVP is
single-device.

### 2.6 Reservations

**Constraint:** a reservation is a different lifecycle from current occupancy; don't overload table
status.

### 2.7 Turnover analytics

**Constraint:** session start/end timestamps must be stored.

### 2.8 Visual floor plan

**Constraint:** reserved position coordinates.

### 2.9 Capacity / party size

**Constraint:** reserved on the table.

---

## 3. Orders

### 3.1 Item-level status

**Expected:** the drink is ready before the food.

**Constraint:** line items need a status field, and order status becomes derived. Order-level statuses
remain valid as the aggregate.

### 3.2 Customer-initiated cancellation

**Constraint:** requires `CANCELLED`/`REJECTED` states (contradictions §1) and an audited actor type.

### 3.3 Scheduled / pre-orders

**Constraint:** needs a scheduled-for timestamp and a session type that isn't "currently seated".

### 3.4 Reorder from history

**Constraint:** past line items must remain readable — archives must not be hard-deleted (D-020).

### 3.5 Order splitting across bills

**Constraint:** allocation model.

### 3.6 Tips

**Constraint:** an additive bill charge line, not a new order field.

### 3.7 Refunds / voids

**Constraint:** a **reversal** entry, never a status rewind or an in-place edit.

### 3.8 Waiter-entered orders

**Constraint:** an order `source` field and an audited actor.

### 3.9 Disputes (wrong/missing item)

**Constraint:** an order-level annotation model; no MVP flow exists.

---

## 4. Kitchen, bar, and printing

### 4.1 Multiple stations per tenant

**Constraint:** a Station entity must exist.

### 4.2 Multiple printers per station

**Constraint:** print jobs must be per station, not per tenant. Reserved, unbuilt.

### 4.3 Printer failure handling

**Constraint:** print job status tracked independently of order status, so a failed print never corrupts an
order.

### 4.4 Kitchen display themes per tenant

**Constraint:** displays must be configurable, not hard-coded.

### 4.5 Preparation-time analytics

**Constraint:** per-item status timestamps must be stored.

### 4.6 Expo / pass screen

**Constraint:** a derived view over the same data.

### 4.7 Ingredient depletion

**Constraint:** inventory integration.

### 4.8 "No preparation" items (water)

**Constraint:** station routing must allow bypass.

---

## 5. Billing and payments

### 5.1 Online payment

**Constraint:** settlement is currently a recorded fact, not a processed transaction. Online payment must
sit on top without changing the bill model.

### 5.2 Tax and service charge

**Constraint:** typed, additive charge lines (D-023). Iranian tax requirements are a legal research task.

### 5.3 Comped items

**Constraint:** discount lines with a reason and actor.

### 5.4 Discount codes / promotions

**Constraint:** a coupon entity with validation rules.

### 5.5 Multiple payers per bill

**Constraint:** settlement must not be 1:1 with a bill.

### 5.6 Receipts

**Constraint:** output format per station; printing is `FUTURE`.

### 5.7 Accounting export

**Constraint:** structured bills and settlements.

---

## 6. Platform

### 6.1 Custom domains

**Constraint:** tenant resolution must be host-capable. `DECIDED` as an architectural accommodation
(D-034).

### 6.2 Multi-branch

**Constraint:** a location dimension. **The tenant/brand boundary is unresolved** (contradictions §4).

### 6.3 Plan tiers and feature gating

**Constraint:** entitlements as data behind a single choke point.

### 6.4 Usage limits

**Constraint:** counting queries must be cheap.

### 6.5 Analytics dashboards

**Constraint:** clean structured data now (D-027); no dashboard until requested.

### 6.6 Data export / tenant portability

**Constraint:** tenant-scoped export must be possible.

### 6.7 Regional hosting

**Constraint:** tenant-to-region affinity must not be hard-coded.

### 6.8 Sharding

**Constraint:** tenant id as the shard key.

---

## 7. Staff and access

### 7.1 Custom roles

**Constraint:** the permission model must be data-driven from day one (`PROPOSED` recommendation in
roles-and-permissions §5.1).

### 7.2 Per-branch roles

**Constraint:** roles are tenant-scoped; branch scope needs adding.

### 7.3 Shift management

**Constraint:** sessions tied to shifts.

### 7.4 Staff performance reporting

**Constraint:** actors recorded on status transitions.

### 7.5 Two-person approval for large discounts

**Constraint:** an approval-workflow entity.

### 7.6 Temporary/delegated access

**Constraint:** time-boxed grants.

---

## 8. Customer experience

### 8.1 Customer accounts (optional)

**Constraint:** must be linkable to a session without changing the anonymous flow.

### 8.2 Order history across visits

**Constraint:** sessions must not be hard-deleted on close.

### 8.3 Loyalty and rewards

**Constraint:** needs stable customer identity — optional account or phone.

### 8.4 Notifications when the tab is closed

**Constraint:** needs a push service, not a socket.

### 8.5 Accessibility enhancements

**Constraint:** a baseline must be set now so it can improve rather than retrofit.

---

## 9. Not planned at all

`DECIDED` non-goals — do not build:

| Item | Reason |
|---|---|
| Native iOS/Android apps | Mobile web first |
| Offline ordering | D-017 |
| Delivery/courier management | Out of scope |
| POS hardware integration | Out of scope |
| Inventory (full system) | Out of scope |
| Marketplace commissions | Not discussed |
| Customer-facing payment | Payment is at the cashier |

---

## 10. The three constraints worth defending hardest

`PROPOSED`

If only three things are preserved for the future, these are they — because breaking any of them forces a
data migration:

| # | Constraint | Breaks |
|---|---|---|
| 1 | **Snapshots on order line items** (D-019) | All historical pricing and reporting |
| 2 | **Orders attach to sessions, not tables** | Table transfer, merge, split |
| 3 | **A location/branch dimension** | Multi-branch |

Everything else can be added with additive schema changes. These three cannot.