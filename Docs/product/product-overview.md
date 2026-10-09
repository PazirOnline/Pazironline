# Product Overview

## 1. What it is

`DECIDED`

A **multi-tenant SaaS platform for cafés and restaurants in Iran** that provides:

1. A **digital menu** the customer browses from their own phone (Persian, RTL, mobile-first).
2. A **table-based ordering workflow** where staff approve the table's ordering session before any
   order can be submitted.
3. An **order lifecycle** that the restaurant operates: received → confirmed → preparing → ready →
   delivered → paid → closed.
4. A **bill** the customer reviews and then pays physically at the restaurant's cashier.

It is **not** a QR-menu website. It is the beginning of a restaurant workflow system with a menu as its
front door.

## 2. The core idea

`DECIDED`

```
A café/restaurant subscribes
      ↓
The restaurant receives QR codes (entrance + one per table)
      ↓
A customer inside the restaurant scans a QR code
      ↓
The customer browses the digital menu (no permission needed)
      ↓
The customer requests ordering access
      ↓
Restaurant staff approves the table's session   ← the anti-abuse gate
      ↓
The customer creates and submits orders for the whole table
      ↓
Kitchen / bar prepare → staff deliver
      ↓
Customer reviews the bill
      ↓
Customer pays at the cashier desk
      ↓
Session closed, data available for reports
```

## 3. The product chain

`DECIDED`

> **Menu → Table → Customer Session → Approval → Order → Preparation → Delivery → Bill → Payment**

This chain is the spine of the system. Every domain document maps onto a link in it. Architecture must
support the whole chain, but each phase only implements what it needs.

## 4. Who it serves

### 4.1 Restaurant side (the paying tenant)

| Actor | Needs |
|---|---|
| **Owner** | Everything: menu, staff, tables, subscription, reports, settings |
| **Manager** | Day-to-day operations: menu edits, staff, tables, orders, reports |
| **Cashier** | Approvals, order entry/adjustment, bill settlement, payment recording |
| **Waiter** | Approvals, order status progression, delivery confirmation, table status |
| **Kitchen** | Kitchen-station order queue only; mark items ready |
| **Barista** | Bar-station order queue only; mark items ready |

The exact permission matrix is `OPEN QUESTION` — see [`../platform/roles-and-permissions.md`](../platform/roles-and-permissions.md).
The **existence** of role-based access is `DECIDED`; the precise matrix is not.

### 4.2 Customer side (the end user)

Anonymous. No forced registration. Browsing is free; ordering requires an approved table session.
See [`../flows/customer-flow.md`](../flows/customer-flow.md).

## 5. Why it exists

`DECIDED` (as given by the founders) plus the following reasoning:

- **The problem**: Iranian cafés/restaurants still run on paper menus and shouting. Orders are lost,
  mis-transcribed, and unpaid-for items walk out the door. There is no reliable record of what was
  ordered, by which table, at what price.
- **The wedge**: the digital menu is what a restaurant owner will *see and evaluate*. It is the demo,
  the sales tool, and the hook.
- **The value**: an order that exists in a system (rather than on a notepad) can be tracked, prepared
  by the right station, billed correctly, and reported on. That is the actual commercial value.
- **Why SaaS and not a custom site**: restaurants churn, prices change weekly, staff change. A
  central multi-tenant platform lets us push improvements to all tenants at once and monetise
  continuously, instead of one-off website projects.

## 6. Value differentiation (why a restaurant pays)

`PROPOSED` — inferred, not yet validated with founders:

1. **Order accuracy** — no lost/misheard orders.
2. **Speed** — customer orders from the table without waiting for staff.
3. **Table-level tracking** — every order attributable to a table and a session.
4. **Price history integrity** — historical orders never mutate when the menu changes.
5. **Operational visibility** — kitchen/bar queues, per-table totals, per-hour demand.
6. **Modern brand presentation** — a premium-looking menu, not a PDF.

Point 4 and point 5 are the differentiators against "simple QR menu" competitors. Points 1–3 and 6 are
table stakes.

## 7. Non-goals for the MVP

`DECIDED`

- ❌ Online payment / card integration / online wallet
- ❌ Offline-first operation or offline sync
- ❌ Inventory management
- ❌ Delivery / courier management
- ❌ Full POS replacement (cashier hardware integration)
- ❌ Analytics dashboards
- ❌ Custom domains
- ❌ Multi-branch management UI
- ❌ Advanced modifier/variant engine
- ❌ Native mobile apps (mobile web first)

## 8. Explicit "DO NOT ASSUME" list

`DO NOT ASSUME`

- Do **not** assume GPS or restaurant Wi-Fi verification exists. It is explicitly **rejected** as the
  primary security mechanism. See [`../domain/approval-system.md`](../domain/approval-system.md).
- Do **not** assume a printer or KDS monitor exists in every restaurant. Both are optional deployment
  shapes. See [`../domain/kitchen-and-bar.md`](../domain/kitchen-and-bar.md).
- Do **not** assume the price unit is Toman or Rial — unresolved.
- Do **not** assume subscription pricing, plan tiers, or trial lengths. Unresolved.
- Do **not** assume every person at a table scans. One device per table is the MVP reality.
- Do **not** assume order statuses map 1:1 to customer-facing wording. There are two layers.
- Do **not** assume internal IDs appear in any customer-facing URL or QR.

## 9. How the docs are organised around the chain

| Chain link | Primary doc |
|---|---|
| Menu | [`../domain/menu-system.md`](../domain/menu-system.md) |
| Table | [`../domain/table-management.md`](../domain/table-management.md) |
| Customer Session | [`../domain/customer-sessions.md`](../domain/customer-sessions.md) |
| Approval | [`../domain/approval-system.md`](../domain/approval-system.md) |
| Order | [`../domain/order-system.md`](../domain/order-system.md) |
| Preparation | [`../domain/kitchen-and-bar.md`](../domain/kitchen-and-bar.md) |
| Delivery | [`../domain/order-state-machine.md`](../domain/order-state-machine.md) |
| Bill | [`../domain/billing.md`](../domain/billing.md) |
| Payment | [`../domain/billing.md`](../domain/billing.md) |

## 10. Current phase

`DECIDED`

**Documentation phase.** No application code exists in the repository. The next deliverable, when
implementation is authorised, is the **customer menu demo** — see
[`../product/roadmap.md`](../product/roadmap.md) and
[`../product/design-system.md`](../product/design-system.md).

## 11. Open questions specific to this document

- Exact positioning statement and target segment (independent cafés? chains? hookah cafés?).
- Whether the platform also serves non-café verticals (fast food, bakeries) in phase 2+.
- Whether the tenant boundary is *restaurant* or *brand* for reporting purposes (multi-branch).
- Pricing, plans, trial — see [`../governance/open-questions.md`](../governance/open-questions.md#business).